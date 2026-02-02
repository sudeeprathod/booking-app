const { createEventSchema, bookSeatSchema } = require('../dto/eventDto');

describe('Validation Schemas', () => {
  describe('createEventSchema', () => {
    it('should validate correct event data', () => {
      const validData = {
        name: 'Concert A',
        totalSeats: 100,
      };

      const { error } = createEventSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing name', () => {
      const invalidData = {
        totalSeats: 100,
      };

      const { error } = createEventSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid totalSeats', () => {
      const invalidData = {
        name: 'Concert A',
        totalSeats: 0,
      };

      const { error } = createEventSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject name exceeding max length', () => {
      const invalidData = {
        name: 'A'.repeat(201),
        totalSeats: 100,
      };

      const { error } = createEventSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('bookSeatSchema', () => {
    it('should validate correct booking data (seats only, userId from auth)', () => {
      const validData = { seats: 2 };

      const { error } = bookSeatSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing seats', () => {
      const invalidData = {};

      const { error } = bookSeatSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject invalid seats', () => {
      const invalidData = { seats: 0 };

      const { error } = bookSeatSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
