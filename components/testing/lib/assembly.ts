export interface AssemblyMessageContaining {
  id: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export function assemblyMessagesContaining(messages: AssemblyMessageContaining[]): any {
  return expect.arrayContaining(
    messages.map(({ id, level, message }) =>
      expect.objectContaining({
        id,
        level,
        entry: expect.objectContaining({ data: message }),
      }),
    ),
  );
}
