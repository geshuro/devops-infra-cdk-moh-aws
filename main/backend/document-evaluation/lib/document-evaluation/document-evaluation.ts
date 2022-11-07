import _ from "lodash";
import {
  AttributeName,
  Entity,
  ICD10CMConcept,
  ICD10CMEntity,
  RxNormConcept,
  RxNormEntity,
} from "@aws-sdk/client-comprehendmedical";
import { readFileSync } from "fs";
import { average } from "@aws-ee/common";
import {
  getPicoCategories,
  isPicoType,
  PicoCategories,
  PicoType,
} from "./pico-categories";

export type Concept = ICD10CMConcept | RxNormConcept;
type ComprehendPaths = {
  entities: string;
  id10Cms: string;
  rxNorms: string;
};
type ComprehendEntities = {
  entities: readonly Entity[];
  id10Cms: readonly Entity[];
  rxNorms: readonly Entity[];
};
export enum ConceptsType {
  ICD10CMConcepts = "ICD10CMConcepts",
  RxNormConcepts = "RxNormConcepts",
}
export interface Proximity {
  total: number;
}

export interface PicoProximity extends Proximity {
  picoCategories: PicoCategories;
}

export interface PicoProximityAverage extends Proximity {
  documentId?: string;
  total: number;
  p: number;
  i: number;
  c: number;
  o: number;
}

/**
 * @param entity  to evaluate
 * @returns       true iff entity type is ICD10CMEntity */
const isICD10CMEntity = (entity: Entity): entity is ICD10CMEntity =>
  "ICD10CMConcepts" in entity;

/**
 * @param entity  to evaluate
 * @returns       true iff entity type is RxNormEntity */
const isRxNormEntity = (entity: Entity): entity is RxNormEntity =>
  "RxNormConcepts" in entity;

/**
 * @description     filters entities to only contain items not in id10Cms or rxNorms
 * @param entities  to be filtered
 * @param id10Cms   to be removed from entities
 * @param rxNorms   to be removed from entities
 * @returns         entities with items appearing in id10cms or rxNorms removed */
const filterUniqueEntities = (
  comprehendEntities: ComprehendEntities
): readonly Entity[] =>
  _.filter(comprehendEntities.entities, entity => {
    const entityMatches = (es: readonly Entity[]) => {
      const pickAttributes = (e: Entity) =>
        _.pick(e, ["Text", "BeginOffset", "EndOffset", "Category", "Type"]);
      return _.some(_.map(es, pickAttributes), (e: Entity) =>
        _.isEqual(e, pickAttributes(entity))
      );
    };
    return (
      !entityMatches(comprehendEntities.id10Cms) &&
      !entityMatches(comprehendEntities.rxNorms)
    );
  });

/**
 * @description     merges entities with id10cms and rxNorms, removing entities that exist in id10cms or rxNorms
 * @param entities  to combine with id10Cms and rxNorms
 * @param id10Cms   to combine with entities
 * @param rxNorms   to combine with entities
 * @returns         entities combined with id10Cms and rxNorms, with duplicates removed */
const mergeEntities = (
  comprehendEntities: ComprehendEntities
): readonly Entity[] => {
  const uniqueEntities = filterUniqueEntities(comprehendEntities);
  return [
    ...uniqueEntities,
    ...comprehendEntities.id10Cms,
    ...comprehendEntities.rxNorms,
  ];
};

/**
 * @param entity  to test for negation
 * @returns       entity is negated */
const isNegated = (entity: Entity): boolean =>
  _.find(entity.Traits, a => a.Name === AttributeName.NEGATION) !== undefined;

/**
 * @param a to compare
 * @param b to compare
 * @returns true iff negation is equal for a and b, ie both or neither of their Traits contains an item named AttributeName.NEGATION */
const hasEqualNegation = (a: Entity, b: Entity): boolean =>
  isNegated(a) === isNegated(b);

/**
 * @param a to compare
 * @param b to compare
 * @returns true iff a and b are equal when compared using their text, category and negation */
const isEqualEntities = (a: Entity, b: Entity): boolean =>
  a.Text === b.Text && a.Category === b.Category && hasEqualNegation(a, b);

/**
 * @param eA entity to which cA belongs
 * @param eB entity to which cB belongs
 * @param cA to compare
 * @param cB to compare
 * @returns   true iff cA and cB have equal code and their respective entities have equal negation */
const isEqualConcepts = (
  eA: Entity,
  eB: Entity,
  cA: Concept,
  cB: Concept
): boolean => cA.Code === cB.Code && hasEqualNegation(eA, eB);

/**
 * @param a to compare
 * @param b to compare
 * @returns proximity of a to b, ie the ratio of their Scores, capped at 1 and set to zero if either is missing */
const calculateProximity = (a: Entity, b: Entity): Proximity => {
  const total = a.Score && b.Score ? Math.min(a.Score / b.Score, 1) : 0;
  return { total };
};

/**
 * @param p to compare to
 * @param a to compare
 * @param b to compare
 * @returns p, or proximity of a to b if this is greater */
const maxProximityEntities = (p: Proximity, a: Entity, b: Entity): Proximity =>
  calculateProximity(a, b).total > p.total ? calculateProximity(a, b) : p;

/**
 * @param conceptsType  specifying concept type to return
 * @param entity        for which to return concepts
 * @returns             specified concepts from entity */
const getConcepts = (
  conceptsType: ConceptsType,
  entity: ICD10CMEntity | RxNormEntity
): readonly Concept[] => {
  switch (conceptsType) {
    case ConceptsType.ICD10CMConcepts:
      return (entity as ICD10CMEntity).ICD10CMConcepts || [];
    case ConceptsType.RxNormConcepts:
      return (entity as RxNormEntity).RxNormConcepts || [];
    default:
      return [];
  }
};

/**
 * @param p             to compare to
 * @param a             to compare
 * @param b             to compare
 * @param conceptsType  specifying concept type to compare on
 * @returns             p, or maximum proximity of a to b across all their concepts if this is greater */
const maxProximityConcepts = (
  p: Proximity,
  a: Entity,
  b: Entity,
  conceptsType: ConceptsType
): Proximity =>
  _.reduce(
    getConcepts(conceptsType, b),
    (maxProximityB, conceptB) =>
      _.reduce(
        getConcepts(conceptsType, a),
        (maxProximityA, conceptA) =>
          isEqualConcepts(a, b, conceptA, conceptB)
            ? maxProximityEntities(maxProximityA, conceptA, conceptB)
            : maxProximityA,
        maxProximityB
      ),
    p
  );

/**
 * @param p to compare to
 * @param a to compare
 * @param b to compare
 * @returns p, or maximum proximity of a to b across all concepts (or entities if their concepts do not match) if this is greater */
const maxProximityConceptsOrEntities =
  (b: Entity) =>
  (p: Proximity, a: Entity): Proximity => {
    const proximity =
      (isICD10CMEntity(b) &&
        maxProximityConcepts(p, a, b, ConceptsType.ICD10CMConcepts)) ||
      (isRxNormEntity(b) &&
        maxProximityConcepts(p, a, b, ConceptsType.RxNormConcepts)) ||
      p;
    return proximity.total === 0 && isEqualEntities(b, a)
      ? maxProximityEntities(proximity, b, a)
      : proximity;
  };

/**
 * @param picoProximities for which to return function
 * @returns               function returns the average proximity within picoProximities for a specified PicoType, or all PicoTypes if none is specified */
const getAverageCurried =
  (picoProximities: PicoProximity[]) =>
  (picoType?: PicoType): number => {
    const filteredProximitiesTotals = picoProximities
      .filter(picoProximity =>
        picoType ? isPicoType(picoType, picoProximity.picoCategories) : true
      )
      .map(picoProximity => picoProximity.total);
    return average(filteredProximitiesTotals);
  };

/**
 * @param picoProximities for which to return averages
 * @returns               average across all picoProximities along with averages for P, I, C and O items */
const getPicoProximityAverage = (
  picoProximities: PicoProximity[]
): PicoProximityAverage => {
  const getAverage = getAverageCurried(picoProximities);
  return {
    total: getAverage(),
    p: getAverage(PicoType.P),
    i: getAverage(PicoType.I),
    c: getAverage(PicoType.C),
    o: getAverage(PicoType.O),
  };
};

/**
 * @description                       returns average proximity of document to question. The Cochrane PICO Ontology is used for each entity
 *                                    in the question to determine which category / categories (P, I, C, O) it falls into; the P, I, C and O
 *                                    elements of the returned PicoProximityAverage are calculated using this data. The total in the returned
 *                                    PicoProximityAverage does not use the PICO Ontology and is thus the average proximity across all entities
 * @param documentComprehendEntities  to compare
 * @param questionComprehendEntities  to compare to
 * @returns                           average proximity of document to question */
export const calculateProximityFromEntitiesQuestion = (
  documentComprehendEntities: ComprehendEntities,
  questionComprehendEntities: ComprehendEntities
): PicoProximityAverage => {
  const mergedQuestionEntities = mergeEntities(questionComprehendEntities);
  const mergedDocumentEntities = mergeEntities(documentComprehendEntities);
  const bestPicoProximities: PicoProximity[] = _.map(
    mergedQuestionEntities,
    mergedQuestionEntity => ({
      ..._.reduce(
        mergedDocumentEntities,
        maxProximityConceptsOrEntities(mergedQuestionEntity),
        {
          total: 0,
        }
      ),
      picoCategories: getPicoCategories(mergedQuestionEntity),
    })
  );

  return getPicoProximityAverage(bestPicoProximities);
};

/**
 * @description                       returns average proximity of document to specified P, I, C and O entities. The Cochrane PICO ontology
 *                                    is not used to determine proximity. Instead, the proximity for P is determined as the proximity of the
 *                                    document to each entity in pComprehendEntities; the same calculation is undertaken for I, C and O. These
 *                                    proximities are then returned along with the average across them all
 * @param documentComprehendEntities  to compare
 * @param pComprehendEntities         to compare to
 * @param iComprehendEntities         to compare to
 * @param cComprehendEntities         to compare to
 * @param oComprehendEntities         to compare to
 * @returns                           average proximity of document to P, I, C and O */
export const calculateProximityFromEntitiesPico = (
  documentComprehendEntities: ComprehendEntities,
  pComprehendEntities: ComprehendEntities,
  iComprehendEntities: ComprehendEntities,
  cComprehendEntities: ComprehendEntities,
  oComprehendEntities: ComprehendEntities
): PicoProximityAverage => {
  const calculateProximityFromDocumentEntities = (
    comprehendEntities: ComprehendEntities
  ) =>
    calculateProximityFromEntitiesQuestion(
      documentComprehendEntities,
      comprehendEntities
    ).total;
  const p = calculateProximityFromDocumentEntities(pComprehendEntities);
  const i = calculateProximityFromDocumentEntities(iComprehendEntities);
  const c = calculateProximityFromDocumentEntities(cComprehendEntities);
  const o = calculateProximityFromDocumentEntities(oComprehendEntities);
  const total = average([p, i, c, o]);
  return {
    p,
    i,
    c,
    o,
    total,
  };
};

/**
 * @description                   returns average proximity of document to question. The Cochrane PICO Ontology is used for each entity
 *                                in the question to determine which category / categories (P, I, C, O) it falls into; the P, I, C and O
 *                                elements of the returned PicoProximityAverage are calculated using this data. The total in the returned
 *                                PicoProximityAverage does not use the PICO Ontology and is thus the average proximity across all entities
 * @param documentComprehendPaths to compare
 * @param questionComprehendPaths to compare to
 * @returns                       average proximity of document to question */
export const calculateProximityFromPathsQuestion = (
  documentComprehendPaths: ComprehendPaths,
  questionComprehendPaths: ComprehendPaths
): PicoProximityAverage => {
  const importJsonEntities = (stringPath: string) =>
    JSON.parse(readFileSync(stringPath, "utf8")).Entities;
  return calculateProximityFromEntitiesQuestion(
    _.mapValues(documentComprehendPaths, importJsonEntities),
    _.mapValues(questionComprehendPaths, importJsonEntities)
  );
};

/** Exported for unit testing only */
export const exportedForJest = {
  calculateProximity,
  filterUniqueEntities,
  getAverageCurried,
  getConcepts,
  getPicoProximityAverage,
  hasEqualNegation,
  isEqualConcepts,
  isEqualEntities,
  isNegated,
  maxProximityConcepts,
  maxProximityConceptsOrEntities,
  maxProximityEntities,
  mergeEntities,
};
