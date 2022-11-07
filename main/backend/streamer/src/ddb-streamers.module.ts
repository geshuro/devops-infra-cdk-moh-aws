import { Module } from '@nestjs/common';
import { BackendCommonModule } from '@aws-ee/backend-common';
import { OpenSearchDocumentModule } from '@aws-ee/opensearch-api';
import { ArticlesStreamerService } from './services/articles-streamer.service';
import { ScreeningsStreamerService } from './services/screenings-streamer.service';

const providers = [ArticlesStreamerService, ScreeningsStreamerService];

@Module({
  imports: [BackendCommonModule, OpenSearchDocumentModule],
  providers,
  exports: providers,
})
export class DdbStreamersModule {}
