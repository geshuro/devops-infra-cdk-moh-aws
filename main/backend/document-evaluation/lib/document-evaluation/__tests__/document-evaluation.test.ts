import _ from "lodash";
import path from "path";
import { readFileSync } from "fs";
import { fc, itProp } from "jest-fast-check";
import {
  AttributeName,
  Entity,
  ICD10CMEntity,
  RxNormEntity,
} from "@aws-sdk/client-comprehendmedical";
import { average } from "@aws-ee/common";
import {
  ComprehendPaths,
  getComprehendPaths,
} from "./__utils__/import-comprehend";
import {
  picoCategoriesArbitrary,
  picoTypeArbitrary,
} from "./__utils__/arbitraries";
import {
  calculateProximityFromEntitiesPico,
  calculateProximityFromEntitiesQuestion,
  calculateProximityFromPathsQuestion,
  Concept,
  ConceptsType,
  exportedForJest,
  PicoProximity,
  Proximity,
} from "../document-evaluation";
import { PicoType } from "../pico-categories";

const {
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
} = exportedForJest;

describe("calculateProximity", () => {
  const calculateDocumentProximitiesFromPathsQuestion = (
    screeningPath: string,
    documentsComprehendPath: string,
    questionComprehendPath: string
  ): readonly number[] =>
    getComprehendPaths(
      screeningPath,
      documentsComprehendPath,
      questionComprehendPath
    ).map((comprehendPaths: ComprehendPaths) => {
      const totalProximity = calculateProximityFromPathsQuestion(
        {
          entities: comprehendPaths.documentEntitiesPath,
          id10Cms: comprehendPaths.documentId10CmPath,
          rxNorms: comprehendPaths.documentRxNormPath,
        },
        {
          entities: comprehendPaths.questionEntitiesPath,
          id10Cms: comprehendPaths.questionId10CmPath,
          rxNorms: comprehendPaths.questionRxNormPath,
        }
      ).total;
      return totalProximity;
    });

  const getComprehendEntitiesFromPaths = (
    screeningPath: string,
    documentsComprehendPath: string,
    questionComprehendPath: string
  ) =>
    getComprehendPaths(
      screeningPath,
      documentsComprehendPath,
      questionComprehendPath
    ).map((comprehendPaths: ComprehendPaths) => {
      const mappedValues = _.mapValues(
        comprehendPaths,
        (s: string) => JSON.parse(readFileSync(s, "utf8")).Entities
      );
      return {
        document: {
          entities: mappedValues.documentEntitiesPath,
          id10Cms: mappedValues.documentId10CmPath,
          rxNorms: mappedValues.documentRxNormPath,
        },
        question: {
          entities: mappedValues.questionEntitiesPath,
          id10Cms: mappedValues.questionId10CmPath,
          rxNorms: mappedValues.questionRxNormPath,
        },
      };
    });

  const calculateDocumentProximitiesFromEntitiesQuestion = (
    screeningPath: string,
    documentsComprehendPath: string,
    questionComprehendPath: string
  ): readonly number[] =>
    getComprehendEntitiesFromPaths(
      screeningPath,
      documentsComprehendPath,
      questionComprehendPath
    ).map(entities => {
      const totalProximity = calculateProximityFromEntitiesQuestion(
        entities.document,
        entities.question
      ).total;
      return totalProximity;
    });

  const calculateDocumentProximitiesFromEntitiesPico = (
    screeningPath: string,
    documentsComprehendPath: string,
    questionComprehendPath: string
  ): readonly number[] =>
    getComprehendEntitiesFromPaths(
      screeningPath,
      documentsComprehendPath,
      questionComprehendPath
    ).map(entities => {
      const totalProximity = calculateProximityFromEntitiesPico(
        entities.document,
        entities.question,
        entities.question,
        entities.question,
        entities.question
      ).total;
      return totalProximity;
    });

  const dataPath = path.resolve(__dirname, "data/gpc-cpp");
  const questionComprehendPath = "question/comprehend-medical-outputs";
  const documentsComprehendPathInclusion =
    "abstracts/inclusion/comprehend-medical-outputs";
  const documentsComprehendPathExclusion =
    "abstracts/exclusion/comprehend-medical-outputs";
  const gpcCppInclusionExclusionRatio = 4.5571468956237435;
  describe("calculateProximityFromPathsQuestion", () => {
    it("returns expected proximities for GPC CPP inclusion and exclusion data", () =>
      expect(
        average(
          calculateDocumentProximitiesFromPathsQuestion(
            dataPath,
            documentsComprehendPathInclusion,
            questionComprehendPath
          )
        ) /
          average(
            calculateDocumentProximitiesFromPathsQuestion(
              dataPath,
              documentsComprehendPathExclusion,
              questionComprehendPath
            )
          )
      ).toBe(gpcCppInclusionExclusionRatio));
  });

  describe("calculateProximityFromEntitiesQuestion", () => {
    it("returns expected proximities for GPC CPP inclusion and exclusion data", () =>
      expect(
        average(
          calculateDocumentProximitiesFromEntitiesQuestion(
            dataPath,
            documentsComprehendPathInclusion,
            questionComprehendPath
          )
        ) /
          average(
            calculateDocumentProximitiesFromEntitiesQuestion(
              dataPath,
              documentsComprehendPathExclusion,
              questionComprehendPath
            )
          )
      ).toBe(gpcCppInclusionExclusionRatio));
  });

  describe("calculateProximityFromEntitiesPico", () => {
    it("returns expected proximities for GPC CPP inclusion and exclusion data", () =>
      expect(
        average(
          calculateDocumentProximitiesFromEntitiesPico(
            dataPath,
            documentsComprehendPathInclusion,
            questionComprehendPath
          )
        ) /
          average(
            calculateDocumentProximitiesFromEntitiesPico(
              dataPath,
              documentsComprehendPathExclusion,
              questionComprehendPath
            )
          )
      ).toBe(gpcCppInclusionExclusionRatio));
  });

  itProp(
    "returns expected proximities for simple test data",
    [
      fc.string(),
      fc.string(),
      fc.double(),
      fc.double(),
      fc.double(),
      fc.double(),
      fc.double(),
    ],
    (text, category, documentScore, pScore, iScore, cScore, oScore) => {
      const getSimpleEntity = (score: number) => ({
        entities: [{ Text: text, Category: category, Score: score }],
        id10Cms: [],
        rxNorms: [],
      });
      const getDocumentScoreRatio = (score: number) => {
        if (documentScore === 0) return 0;
        if (score >= documentScore) return 1;
        return score / documentScore;
      };

      const p = getDocumentScoreRatio(pScore);
      const i = getDocumentScoreRatio(iScore);
      const c = getDocumentScoreRatio(cScore);
      const o = getDocumentScoreRatio(oScore);
      const total = (p + i + c + o) / 4;
      expect(
        calculateProximityFromEntitiesPico(
          getSimpleEntity(documentScore),
          getSimpleEntity(pScore),
          getSimpleEntity(iScore),
          getSimpleEntity(cScore),
          getSimpleEntity(oScore)
        )
      ).toEqual({
        p,
        i,
        c,
        o,
        total,
      });
    }
  );
});

describe("document evaluation", () => {
  const toConcepts = (entities: Entity[]) => {
    const concepts = _.partition(
      entities,
      entity =>
        (entity && (entity as ICD10CMEntity).ICD10CMConcepts) ||
        (entity && (entity as RxNormEntity).RxNormConcepts)
    );
    const results = _.partition(
      concepts[0],
      concept => concept && (concept as ICD10CMEntity).ICD10CMConcepts
    );
    return { id10Cms: results[0], rxNorms: results[1] };
  };

  const categoryScoreTextArbitraries = {
    Category: fc.string(),
    Score: fc.option(fc.double(), { nil: undefined }),
    Text: fc.string(),
  };

  const proximityArbitraries = {
    total: fc.double(),
  };

  const entityArbitraries = {
    ...categoryScoreTextArbitraries,
    Attributes: fc.array(fc.record({ Text: fc.string() })),
    BeginOffset: fc.integer(),
    EndOffset: fc.integer(),
    Id: fc.integer(),
    Traits: fc.array(
      fc.record({
        Name: fc.oneof(fc.constant(AttributeName.NEGATION), fc.string()),
        Score: fc.double(),
      })
    ),
    Type: fc.string(),
  };

  const categoryScoreTextArbitrary = fc.record(categoryScoreTextArbitraries);
  const icd10CmRxNormConceptArbitrary = fc.record({
    Code: fc.oneof(fc.constant("1"), fc.constant("1")),
    Score: fc.option(fc.double(), { nil: undefined }),
  });
  const icd10CmRxNormConceptsArbitrary = fc.option(
    fc.array(icd10CmRxNormConceptArbitrary),
    {
      nil: undefined,
    }
  );
  const entityArbitrary = fc.record(entityArbitraries);
  const icd10CmEntityArbitrary = fc.record({
    ...entityArbitraries,
    ICD10CMConcepts: icd10CmRxNormConceptsArbitrary,
  });
  const rxNormEntityArbitrary = fc.record({
    ...entityArbitraries,
    RxNormConcepts: icd10CmRxNormConceptsArbitrary,
  });
  const conceptsTypeArbitrary = fc.oneof(
    fc.constant(ConceptsType.ICD10CMConcepts),
    fc.constant(ConceptsType.RxNormConcepts)
  );
  const proximityArbitrary = fc.record(proximityArbitraries);
  const picoProximityArbitrary = fc.record({
    ...proximityArbitraries,
    picoCategories: picoCategoriesArbitrary,
  });
  const conceptsA: Concept[] = [
    { Code: "1", Score: 0.6 },
    { Code: "2", Score: 0.2 },
    { Code: "3", Score: 0.2 },
  ];
  const conceptsB: Concept[] = [
    { Code: "2", Score: 0.6 },
    { Code: "3", Score: 0.4 },
    { Code: "4", Score: 0.7 },
  ];
  const proximityAb: Proximity = { total: 0.5 };
  const proximityNone: Proximity = { total: 0 };

  describe("filterUniqueEntities", () => {
    itProp(
      "removes entities appearing in ID10CM or RxNorm",
      [
        fc.array(
          fc.record({
            ...entityArbitraries,
            ICD10CMConcepts: fc.option(fc.array(fc.array(fc.object()))),
            RxNormConcepts: fc.option(fc.array(fc.array(fc.object()))),
          })
        ),
      ],
      records => {
        const entities = records as Entity[];
        const { id10Cms, rxNorms } = toConcepts(entities);

        const uniqueEntities = filterUniqueEntities({
          entities,
          id10Cms,
          rxNorms,
        });
        const uniqueEntitiesInId10Cms = _.intersection(
          id10Cms as Entity[],
          uniqueEntities
        );
        const uniqueEntitiesInRxNorms = _.intersection(
          rxNorms as Entity[],
          uniqueEntities
        );
        expect(uniqueEntitiesInId10Cms).toHaveLength(0);
        expect(uniqueEntitiesInRxNorms).toHaveLength(0);
      }
    );
  });

  describe("mergeEntities", () => {
    itProp(
      "merges entities with ID10CM AND RxNorm",
      [fc.array(entityArbitrary)],
      records => {
        const entities = records as Entity[];
        const { id10Cms, rxNorms } = toConcepts(entities);
        const mergedEntities = mergeEntities({
          entities,
          id10Cms,
          rxNorms,
        });
        expect(_.difference(entities, mergedEntities)).toHaveLength(0);
        expect(mergedEntities).toHaveLength(entities.length);
      }
    );
  });

  const entityHasNegationTrait = (entity: Entity) =>
    entity.Traits?.find(a => a.Name === AttributeName.NEGATION) !== undefined;

  describe("isNegated", () => {
    itProp(
      "returns true iff entity is negated",
      [entityArbitrary],
      (entity: Entity) => {
        expect(isNegated(entity)).toBe(entityHasNegationTrait(entity));
      }
    );
  });

  describe("hasEqualNegation", () => {
    itProp(
      "returns true iff entities have equal negation",
      [entityArbitrary, entityArbitrary],
      (a: Entity, b: Entity) => {
        expect(hasEqualNegation(a, b)).toBe(
          entityHasNegationTrait(a) === entityHasNegationTrait(b)
        );
      }
    );
  });

  describe("isEqualEntities", () => {
    itProp(
      "returns false unless entities are equal in Text, Category and Traits",
      [entityArbitrary, entityArbitrary],
      (a: Entity, b: Entity) => {
        expect(isEqualEntities(a, b)).toBe(
          a.Text === b.Text &&
            a.Category === b.Category &&
            entityHasNegationTrait(a) === entityHasNegationTrait(b)
        );
      }
    );
  });

  describe("isEqualConcepts", () => {
    itProp(
      "returns false unless entities are equal in Code and Traits for ICD10CMEntity",
      [
        entityArbitrary,
        entityArbitrary,
        icd10CmRxNormConceptArbitrary,
        icd10CmRxNormConceptArbitrary,
      ],
      (eA: Entity, eB: Entity, cA: Concept, cB: Concept) => {
        expect(isEqualConcepts(eA, eB, cA, cB)).toBe(
          cA.Code === cB.Code &&
            entityHasNegationTrait(eA) === entityHasNegationTrait(eB)
        );
      }
    );
  });

  describe("calculateProximity", () => {
    itProp(
      "returns ratio of entity scores, with a maximum value of one and zero value if either score is missing",
      [entityArbitrary, entityArbitrary],
      (a, b) => {
        const ratio = a.Score && b.Score ? a.Score / b.Score : 0;
        expect(calculateProximity(a, b).total).toBe(ratio <= 1 ? ratio : 1);
      }
    );
    itProp("returns zero when second parameter is zero", [entityArbitrary], a =>
      expect(calculateProximity(a, { Score: 0 }).total).toBe(0)
    );
  });

  describe("maxProximityEntities", () => {
    itProp(
      "returns the proximity between the entities, or the proximity parameter if this is greater",
      [entityArbitrary, entityArbitrary, proximityArbitrary],
      (a, b, proximity) => {
        const proximityAb = calculateProximity(a, b);
        expect(maxProximityEntities(proximity, a, b)).toEqual(
          proximityAb.total > proximity.total ? proximityAb : proximity
        );
      }
    );
  });

  describe("getConcepts", () => {
    itProp(
      "returns the concepts for the specified type, or empty list where these are missing",
      [
        entityArbitrary,
        icd10CmEntityArbitrary,
        rxNormEntityArbitrary,
        fc.oneof(conceptsTypeArbitrary, fc.string()),
      ],
      (
        entity: Entity,
        icd10CmEntity: ICD10CMEntity,
        rxNormEntity: RxNormEntity,
        conceptsType: ConceptsType | string
      ) => {
        expect(getConcepts(conceptsType as ConceptsType, entity)).toHaveLength(
          0
        );
        switch (conceptsType) {
          case ConceptsType.ICD10CMConcepts:
            expect(getConcepts(conceptsType, icd10CmEntity)).toEqual(
              icd10CmEntity.ICD10CMConcepts || []
            );
            expect(getConcepts(conceptsType, rxNormEntity)).toHaveLength(0);
            break;
          case ConceptsType.RxNormConcepts:
            expect(getConcepts(conceptsType, icd10CmEntity)).toHaveLength(0);
            expect(getConcepts(conceptsType, rxNormEntity)).toEqual(
              rxNormEntity.RxNormConcepts || []
            );
            break;
          default:
            expect(
              getConcepts(conceptsType as ConceptsType, entity)
            ).toHaveLength(0);
        }
      }
    );
  });

  describe("maxProximityConcepts", () => {
    it("returns maximum proximity across specified concepts, or proximity parameter if this is greater", () => {
      const a: ICD10CMEntity = {
        ICD10CMConcepts: conceptsA,
      };
      const b: ICD10CMEntity = {
        ICD10CMConcepts: conceptsB,
      };
      const proximitySmall = { total: 0.2 };
      const proximityLarge = { total: 0.7 };
      expect(
        maxProximityConcepts(proximitySmall, a, b, ConceptsType.RxNormConcepts)
      ).toBe(proximitySmall);
      expect(
        maxProximityConcepts(proximitySmall, a, b, ConceptsType.ICD10CMConcepts)
      ).toEqual(proximityAb);
      expect(
        maxProximityConcepts(proximityLarge, a, b, ConceptsType.ICD10CMConcepts)
      ).toBe(proximityLarge);
    });

    itProp(
      "returns the proximity parameter when specified concepts do not exist in both entities",
      [
        icd10CmEntityArbitrary,
        icd10CmEntityArbitrary,
        rxNormEntityArbitrary,
        rxNormEntityArbitrary,
        conceptsTypeArbitrary,
        proximityArbitrary,
      ],
      (
        icd10CmEntityA: ICD10CMEntity,
        icd10CmEntityB: ICD10CMEntity,
        rxNormEntityA: RxNormEntity,
        rxNormEntityB: RxNormEntity,
        conceptsType,
        proximity
      ) => {
        expect(
          maxProximityConcepts(
            proximity,
            icd10CmEntityA,
            icd10CmEntityB,
            ConceptsType.RxNormConcepts
          )
        ).toBe(proximity);
        expect(
          maxProximityConcepts(
            proximity,
            rxNormEntityA,
            rxNormEntityB,
            ConceptsType.ICD10CMConcepts
          )
        ).toBe(proximity);
        expect(
          maxProximityConcepts(
            proximity,
            icd10CmEntityA,
            rxNormEntityB,
            conceptsType
          )
        ).toBe(proximity);
      }
    );
  });

  describe("maxProximityConceptsOrEntities", () => {
    itProp(
      "returns maximum proximity computed using concepts rather than entity when ICD10CMEntity are present",
      [categoryScoreTextArbitrary],
      categoryScoreText => {
        const a: ICD10CMEntity = {
          ...categoryScoreText,
          ICD10CMConcepts: conceptsA,
        };
        const b: ICD10CMEntity = {
          ...categoryScoreText,
          ICD10CMConcepts: conceptsB,
        };
        expect(maxProximityConceptsOrEntities(b)(proximityNone, a)).toEqual(
          proximityAb
        );
      }
    );

    itProp(
      "returns maximum proximity computed using concepts rather than entity when RxNormMEntity are present",
      [categoryScoreTextArbitrary],
      categoryScoreText => {
        const a: RxNormEntity = {
          ...categoryScoreText,
          RxNormConcepts: conceptsA,
        };
        const b: RxNormEntity = {
          ...categoryScoreText,
          RxNormConcepts: conceptsB,
        };
        expect(maxProximityConceptsOrEntities(b)(proximityNone, a)).toEqual(
          proximityAb
        );
      }
    );

    itProp(
      "returns maximum proximity computed using entities when concepts are absent, or proximity parameter if this is greater",
      [categoryScoreTextArbitrary, entityArbitrary, entityArbitrary],
      (categoryScoreText, a: Entity, b: Entity) => {
        expect(maxProximityConceptsOrEntities(b)(proximityNone, a)).toEqual(
          proximityNone
        );
        const aWithCommonCategoryScoreText: Entity = {
          ...a,
          ...categoryScoreText,
        };
        const bWithCommonCategoryScoreText: Entity = {
          ...b,
          ...categoryScoreText,
        };
        expect(
          maxProximityConceptsOrEntities(bWithCommonCategoryScoreText)(
            proximityNone,
            aWithCommonCategoryScoreText
          )
        ).toEqual({
          total:
            entityHasNegationTrait(aWithCommonCategoryScoreText) ===
              entityHasNegationTrait(bWithCommonCategoryScoreText) &&
            categoryScoreText.Score
              ? 1
              : 0,
        });
      }
    );
  });

  describe("getAverageCurried", () => {
    itProp(
      "returns average of PICO proximities for specified type, or total if this is absent",
      [fc.array(picoProximityArbitrary), fc.option(picoTypeArbitrary)],
      (picoProximities, picoType) => {
        const isPicoTypeCurried =
          (picoType: PicoType | null) => (picoProximity: PicoProximity) =>
            picoType
              ? (picoType === PicoType.P && picoProximity.picoCategories.p) ||
                (picoType === PicoType.I && picoProximity.picoCategories.i) ||
                (picoType === PicoType.C && picoProximity.picoCategories.c) ||
                (picoType === PicoType.O && picoProximity.picoCategories.o)
              : true;
        const isIncluded = isPicoTypeCurried(picoType as PicoType);
        const sum = _.reduce(
          picoProximities,
          (acc, picoProximity) =>
            acc + (isIncluded(picoProximity) ? picoProximity.total : 0),
          0
        );
        const count = _.reduce(
          picoProximities,
          (acc, picoProximity) => acc + (isIncluded(picoProximity) ? 1 : 0),
          0
        );
        expect(getAverageCurried(picoProximities)(picoType as PicoType)).toBe(
          sum / count
        );
      }
    );
  });

  describe("getPicoProximityAverage", () => {
    const isPicoTypeCurried =
      (picoProximity: PicoProximity) => (picoType: PicoType | null) =>
        picoType
          ? (picoType === PicoType.P && picoProximity.picoCategories.p) ||
            (picoType === PicoType.I && picoProximity.picoCategories.i) ||
            (picoType === PicoType.C && picoProximity.picoCategories.c) ||
            (picoType === PicoType.O && picoProximity.picoCategories.o)
          : true;
    const sumConditionalCurried =
      (b: number) =>
      (a: number, doSum: boolean): number =>
        doSum ? a + b : a;
    const getIsIncluded = (picoProximity: PicoProximity) => {
      const isPicoType = isPicoTypeCurried(picoProximity);
      return {
        p: isPicoType(PicoType.P),
        i: isPicoType(PicoType.I),
        c: isPicoType(PicoType.C),
        o: isPicoType(PicoType.O),
      };
    };
    const sumOrCount = (picoProximities: PicoProximity[], doSum: boolean) =>
      _.reduce(
        picoProximities,
        (acc, picoProximity) => {
          const toAdd = doSum ? picoProximity.total : 1;
          const isIncluded = getIsIncluded(picoProximity);
          const sumConditional = sumConditionalCurried(toAdd);
          return {
            p: sumConditional(acc.p, isIncluded.p),
            i: sumConditional(acc.i, isIncluded.i),
            c: sumConditional(acc.c, isIncluded.c),
            o: sumConditional(acc.o, isIncluded.o),
            total: acc.total + toAdd,
          };
        },
        {
          p: 0,
          i: 0,
          c: 0,
          o: 0,
          total: 0,
        }
      );
    itProp(
      "returns average across all PICO totals",
      [fc.array(picoProximityArbitrary)],
      picoProximities => {
        const sum = sumOrCount(picoProximities, true);
        const count = sumOrCount(picoProximities, false);
        expect(getPicoProximityAverage(picoProximities)).toEqual({
          p: sum.p / count.p,
          i: sum.i / count.i,
          c: sum.c / count.c,
          o: sum.o / count.o,
          total: sum.total / count.total,
        });
      }
    );
  });
});
