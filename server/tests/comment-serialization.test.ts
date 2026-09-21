import { serialize } from '../src/modules/comments/comments.service';

describe('Serialización de comentarios', () => {
  it('propaga errores de datos en lugar de devolver null silenciosamente', () => {
    expect(() => serialize({
      id: 1,
      taskId: 2,
      authorId: 3,
      body: 'Comentario',
      createdAt: new Date('invalid'),
    })).toThrow(RangeError);
  });
});
