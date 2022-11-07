import _ from "lodash";
import {
  Entity,
  EntitySubType,
  EntityType,
} from "@aws-sdk/client-comprehendmedical";

export interface PicoCategories {
  p: boolean;
  i: boolean;
  c: boolean;
  o: boolean;
}

export enum PicoType {
  P = "P",
  I = "I",
  C = "C",
  O = "O",
}

const hasTypes =
  (types: EntitySubType[]) =>
  (entity: Entity): boolean =>
    !_.isEmpty(
      _.intersectionWith(
        _.map(entity.Attributes, attribute => attribute.Type),
        types
      )
    );

const hasMedicationAttributes = hasTypes([
  EntitySubType.DOSAGE,
  EntitySubType.DURATION,
  EntitySubType.FORM,
  EntitySubType.FREQUENCY,
  EntitySubType.RATE,
  EntitySubType.ROUTE_OR_MODE,
  EntitySubType.STRENGTH,
]);

const hasTestValueAttributes = hasTypes([EntitySubType.TEST_VALUE]);

/**
 * @description   returns the entity mapped to PICO using the Cochrane PICO Ontology
 *
 * | Category                     | Type           | Attribute             | P   | I   | C   | O   |
 * | ---------------------------- | -------------- | --------------------- | --- | --- | --- | --- |
 * | ANATOMY                      | Any            | Any                   | ✓   |     |     | ✓   |
 * | MEDICAL_CONDITION            | Any            | Any                   | ✓   |     |     | ✓   |
 * | MEDICATION                   | Any            | DOSAGE                |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | DURATION              |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | FORM                  |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | FREQUENCY             |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | RATE                  |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | ROUTE_OR_MODE         |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | STRENGTH              |     | ✓   | ✓   |     |
 * | MEDICATION                   | Any            | No attributes defined | ✓   | ✓   | ✓   | ✓   |
 * | PROTECTED_HEALTH_INFORMATION | ADDRESS        | Any                   | ✓   | ✓   | ✓   |     |
 * | PROTECTED_HEALTH_INFORMATION | PROFESSION     | Any                   | ✓   | ✓   | ✓   |     |
 * | PROTECTED_HEALTH_INFORMATION | AGE            | Any                   | ✓   |     |     |     |
 * | TEST_TREATMENT_PROCEDURE     | PROCEDURE_NAME | Any                   | ✓   | ✓   | ✓   | ✓   |
 * | TEST_TREATMENT_PROCEDURE     | TREATMENT_NAME | Any                   | ✓   | ✓   | ✓   | ✓   |
 * | TEST_TREATMENT_PROCEDURE     | TEST_NAME      | Any                   |     |     |     | ✓   |
 * | TEST_TREATMENT_PROCEDURE     | TEST_NAME      | TEST_UNIT             |     |     |     | ✓   |
 * | TEST_TREATMENT_PROCEDURE     | TEST_NAME      | TEST_VALUE            | ✓   |     |     | ✓   |
 * | TIME_EXPRESSION              | Any            | Any                   |     | ✓   | ✓   |     |

 * @param entity  to map to PICO
 * @returns       Cochrane PICO categories to which entity belongs
 * @see           {@link https://data.cochrane.org/ontologies/pico/index-en.html|Cochrane PICO Ontology} */
export const getPicoCategories = (entity: Entity): PicoCategories => {
  const all = { p: true, i: true, c: true, o: true };
  const pic = { p: true, i: true, c: true, o: false };
  const po = { p: true, i: false, c: false, o: true };
  const ic = { p: false, i: true, c: true, o: false };
  const p = { p: true, i: false, c: false, o: false };
  const o = { p: false, i: false, c: false, o: true };
  const none = { p: false, i: false, c: false, o: false };
  switch (entity.Category) {
    case EntityType.ANATOMY:
    case EntityType.MEDICAL_CONDITION:
      return po;
    case EntityType.MEDICATION:
      return hasMedicationAttributes(entity) ? ic : all;
    case EntityType.PROTECTED_HEALTH_INFORMATION:
      switch (entity.Type) {
        case EntitySubType.AGE:
          return p;
        case EntitySubType.ADDRESS:
        case EntitySubType.PROFESSION:
          return pic;
        default:
          return none;
      }
    case EntityType.TEST_TREATMENT_PROCEDURE:
      switch (entity.Type) {
        case EntitySubType.PROCEDURE_NAME:
        case EntitySubType.TREATMENT_NAME:
          return all;
        case EntitySubType.TEST_NAME:
          return hasTestValueAttributes(entity) ? po : o;
        default:
          return none;
      }
    case EntityType.TIME_EXPRESSION:
      return ic;
    default:
      return none;
  }
};

/**
 * @param picoType        against which to test
 * @param picoCategories  to test
 * @returns               true iff picoCategories is of specified type */
export const isPicoType = (
  picoType: PicoType,
  picoCategories: PicoCategories
): boolean => {
  switch (picoType) {
    case PicoType.P:
      return picoCategories.p;
    case PicoType.I:
      return picoCategories.i;
    case PicoType.C:
      return picoCategories.c;
    case PicoType.O:
      return picoCategories.o;
    default:
      return false;
  }
};
