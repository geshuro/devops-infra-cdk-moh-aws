import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class PostDeploymentConfig {
  static KEY = 'postDeploymentConfig';

  @IsString()
  @Expose({ name: 'DUMMY_DATA_BUCKET' })
  dummyDataBucket!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_PDF' })
  dummyDataPdf!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_gcc_cpp_MD' })
  dummyDataAssetsGccCppMD!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_liver_m_MD' })
  dummyDataAssetsLiverMMD!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_liver_p_MD' })
  dummyDataAssetsLiverPMD!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_prostate_m_MD' })
  dummyDataAssetsProstateMMD!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_prostate_p_MD' })
  dummyDataAssetsProstatePMD!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_gcc_cpp_RQ' })
  dummyDataAssetsGccCppRQ!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_liver_m_RQ' })
  dummyDataAssetsLiverMRQ!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_liver_p_RQ' })
  dummyDataAssetsLiverPRQ!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_prostate_m_RQ' })
  dummyDataAssetsProstateMRQ!: string;

  @IsString()
  @Expose({ name: 'DUMMY_DATA_ASSETS_prostate_p_RQ' })
  dummyDataAssetsProstatePRQ!: string;
}
