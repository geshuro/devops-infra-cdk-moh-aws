import _ from "lodash";
import { fc, itProp } from "jest-fast-check";
import {
  Attribute,
  AttributeName,
  Entity,
  EntitySubType,
  EntityType,
} from "@aws-sdk/client-comprehendmedical";
import {
  picoCategoriesArbitrary,
  picoTypeArbitrary,
  toArbitrary,
} from "./__utils__/arbitraries";
import { getPicoCategories, isPicoType, PicoType } from "../pico-categories";

describe("getPicoCategories", () => {
  const entityTypeArbitrary = toArbitrary(Object.values(EntityType));
  const entitySubTypeArbitrary = toArbitrary(Object.values(EntitySubType));
  const entitySubTypeAgeAddressProfessionArbitrary = toArbitrary([
    EntitySubType.ADDRESS,
    EntitySubType.AGE,
    EntitySubType.PROFESSION,
  ]);

  const entitySubTypeProcedureTestTreatmentArbitrary = toArbitrary([
    EntitySubType.PROCEDURE_NAME,
    EntitySubType.TEST_NAME,
    EntitySubType.TREATMENT_NAME,
  ]);

  const categoryScoreTextTypeArbitraries = {
    Category: entityTypeArbitrary,
    Score: fc.option(fc.double(), { nil: undefined }),
    Text: fc.string(),
    Type: entitySubTypeArbitrary,
  };
  const attributeArbitrary = fc.record(categoryScoreTextTypeArbitraries);

  const entityArbitraries = {
    ...categoryScoreTextTypeArbitraries,
    Attributes: fc.array(attributeArbitrary),
    BeginOffset: fc.integer(),
    EndOffset: fc.integer(),
    Id: fc.integer(),
    Traits: fc.array(
      fc.record({
        Name: fc.oneof(fc.constant(AttributeName.NEGATION), fc.string()),
        Score: fc.double(),
      })
    ),
  };

  const entityArbitrary = fc.record(entityArbitraries);
  const entityPHIArbitrary = fc.record({
    ...entityArbitraries,
    Category: fc.constant(EntityType.PROTECTED_HEALTH_INFORMATION),
    Type: entitySubTypeAgeAddressProfessionArbitrary,
  });

  const entityTTPArbitrary = fc.record({
    ...entityArbitraries,
    Category: fc.constant(EntityType.TEST_TREATMENT_PROCEDURE),
    Type: entitySubTypeProcedureTestTreatmentArbitrary,
    Attributes: fc.array(attributeArbitrary),
  });

  itProp(
    "returns expected pico categories for every data type",
    [fc.oneof(entityArbitrary, entityPHIArbitrary, entityTTPArbitrary)],
    (entity: Entity) => {
      const includesMedication = (attributes?: Attribute[]) =>
        attributes &&
        attributes.some(attribute =>
          _.includes(
            [
              EntitySubType.DOSAGE,
              EntitySubType.DURATION,
              EntitySubType.FORM,
              EntitySubType.FREQUENCY,
              EntitySubType.RATE,
              EntitySubType.ROUTE_OR_MODE,
              EntitySubType.STRENGTH,
            ],
            attribute.Type
          )
        );
      const includesTestValue = (attributes?: Attribute[]) =>
        attributes &&
        attributes.some(attribute =>
          _.includes([EntitySubType.TEST_VALUE], attribute.Type)
        );
      const hasEntitySubTypeCurried =
        (entitySubTypes: EntitySubType[]) => (e: Entity) =>
          _.includes(entitySubTypes, e.Type);
      const hasAddressProfession = hasEntitySubTypeCurried([
        EntitySubType.ADDRESS,
        EntitySubType.PROFESSION,
      ]);
      const hasAddressProfessionAge = hasEntitySubTypeCurried([
        EntitySubType.ADDRESS,
        EntitySubType.PROFESSION,
        EntitySubType.AGE,
      ]);
      const hasEntityProcedureTreatment = hasEntitySubTypeCurried([
        EntitySubType.PROCEDURE_NAME,
        EntitySubType.TREATMENT_NAME,
      ]);
      const hasEntityProcedureTreatmentTestName = hasEntitySubTypeCurried([
        EntitySubType.PROCEDURE_NAME,
        EntitySubType.TREATMENT_NAME,
        EntitySubType.TEST_NAME,
      ]);
      const expectedP: boolean =
        entity.Category === EntityType.ANATOMY ||
        entity.Category === EntityType.MEDICAL_CONDITION ||
        (entity.Category === EntityType.MEDICATION &&
          !includesMedication(entity.Attributes)) ||
        (entity.Category === EntityType.PROTECTED_HEALTH_INFORMATION &&
          hasAddressProfessionAge(entity)) ||
        (entity.Category === EntityType.TEST_TREATMENT_PROCEDURE &&
          (hasEntityProcedureTreatment(entity) ||
            (entity.Type === EntitySubType.TEST_NAME &&
              includesTestValue(entity.Attributes)))) ||
        false;
      const expectedIC: boolean =
        entity.Category === EntityType.MEDICATION ||
        (entity.Category === EntityType.PROTECTED_HEALTH_INFORMATION &&
          hasAddressProfession(entity)) ||
        (entity.Category === EntityType.TEST_TREATMENT_PROCEDURE &&
          hasEntityProcedureTreatment(entity)) ||
        entity.Category === EntityType.TIME_EXPRESSION;
      const expectedO: boolean =
        entity.Category === EntityType.ANATOMY ||
        entity.Category === EntityType.MEDICAL_CONDITION ||
        (entity.Category === EntityType.MEDICATION &&
          !includesMedication(entity.Attributes)) ||
        (entity.Category === EntityType.TEST_TREATMENT_PROCEDURE &&
          hasEntityProcedureTreatmentTestName(entity));
      expect(getPicoCategories(entity)).toEqual({
        p: expectedP,
        i: expectedIC,
        c: expectedIC,
        o: expectedO,
      });
    }
  );

  it("returns false for all categories where entity belongs to none", () => {
    expect(getPicoCategories({})).toEqual({
      p: false,
      i: false,
      c: false,
      o: false,
    });
  });
});

describe("isPicoCategory", () => {
  itProp(
    "returns true iff pico categories is of specified type",
    [picoTypeArbitrary, picoCategoriesArbitrary],
    (picoType, picoCategories) =>
      expect(isPicoType(picoType as PicoType, picoCategories)).toBe(
        (picoCategories.p && picoType === PicoType.P) ||
          (picoCategories.i && picoType === PicoType.I) ||
          (picoCategories.c && picoType === PicoType.C) ||
          (picoCategories.o && picoType === PicoType.O)
      )
  );
});
