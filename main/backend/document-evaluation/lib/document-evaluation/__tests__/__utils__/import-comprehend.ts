import _ from "lodash";
import path from "path";
import { readdirSync } from "fs";

export type ComprehendPaths = {
  documentEntitiesPath: string;
  documentId10CmPath: string;
  documentRxNormPath: string;
  questionEntitiesPath: string;
  questionId10CmPath: string;
  questionRxNormPath: string;
};

export const getComprehendPaths = (
  screeningPath: string,
  documentsComprehendPath: string,
  questionComprehendPath: string
): ComprehendPaths[] => {
  const comprehendMedicalOutputsDocumentPath = path.resolve(
    screeningPath,
    documentsComprehendPath
  );
  const comprehendMedicalOutputsQuestionPath = path.resolve(
    screeningPath,
    questionComprehendPath
  );
  const comprehendOutputExtension = "txt.out";
  const documentNames = readdirSync(
    path.resolve(comprehendMedicalOutputsDocumentPath, "entities")
  )
    .filter(a => _.endsWith(a, comprehendOutputExtension))
    .map(a => _.trimEnd(a, comprehendOutputExtension));
  return _.map(documentNames, documentName => {
    const filename = `${documentName}.${comprehendOutputExtension}`;
    const documentEntitiesPath = path.resolve(
      comprehendMedicalOutputsDocumentPath,
      "entities",
      filename
    );
    return {
      documentEntitiesPath,
      documentId10CmPath: path.resolve(
        comprehendMedicalOutputsDocumentPath,
        "id10cm",
        filename
      ),
      documentRxNormPath: path.resolve(
        comprehendMedicalOutputsDocumentPath,
        "rxnorm",
        filename
      ),
      questionEntitiesPath: path.resolve(
        comprehendMedicalOutputsQuestionPath,
        "entities.json"
      ),
      questionId10CmPath: path.resolve(
        comprehendMedicalOutputsQuestionPath,
        "id10cm.json"
      ),
      questionRxNormPath: path.resolve(
        comprehendMedicalOutputsQuestionPath,
        "rxnorm.json"
      ),
    };
  });
};
