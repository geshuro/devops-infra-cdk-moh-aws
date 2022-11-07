import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHelloMessages() {
    return [
      { message: 'Hello, this is the SSTx project' },
      { message: 'hello world' },
      { message: 'Bonjour le monde' }, // French
      { message: 'Hallo Welt' }, // German
      { message: 'Hej Verden' }, // Danish
    ];
  }
}
