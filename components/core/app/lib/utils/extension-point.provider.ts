import { FactoryProvider, Provider, ValueProvider } from '@nestjs/common';

export const ExtensionPoint = <T>(provide: symbol, extensions: Provider<T>[]): FactoryProvider => ({
  provide,
  useFactory: (...instances: T[]) => instances,
  inject: extensions.map((ext) => ('provide' in ext ? ext.provide : ext)),
});

export const ExtensionPointValues = <T>(provide: symbol, extensions: T[]): ValueProvider => ({
  provide,
  useValue: extensions,
});
