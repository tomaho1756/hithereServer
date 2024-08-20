import { Module } from '@nestjs/common';
import { WebrtcGateway } from './webrtc/webrtc.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [WebrtcGateway],
})
export class AppModule {}
