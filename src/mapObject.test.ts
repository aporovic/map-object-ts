import { describe, expect, it } from 'vitest';

import mapObject from './mapObject';

describe('Object Mapper', () => {
  describe('Basic Mapping', () => {
    interface Source {
      id: number;
      name: string;
      age: number;
    }

    interface Destination {
      userId: number;
      userName: string;
      isAdult: boolean;
    }

    it('should map properties with different names', () => {
      const source = { id: 1, name: 'John', age: 25 };
      const excludedProperties = ['age', 'name', 'id'] as const;
      const result = mapObject<Source, Destination, typeof excludedProperties>({
        sourceObject: source,
        mapConfiguration: {
          userId: 'id',
          userName: 'name',
          isAdult: (src) => src.age >= 18,
        },
        options: { excludedProperties },
      });

      expect(result).toEqual({
        userId: 1,
        userName: 'John',
        isAdult: true,
      });
    });
  });

  describe('Automatic Property Mapping', () => {
    interface SourceWithCommon {
      id: number;
      name: string;
      commonProp: string;
    }

    interface DestWithCommon {
      id: number;
      name: string;
      commonProp: string;
      extraProp: string;
    }

    it('should automatically map properties with matching names', () => {
      const source = { id: 1, name: 'Test', commonProp: 'value' };
      const excludedProperties = [] as const;
      const result = mapObject<
        SourceWithCommon,
        DestWithCommon,
        typeof excludedProperties
      >({
        sourceObject: source,
        mapConfiguration: {
          extraProp: () => 'default',
        },
        options: {
          excludedProperties,
        },
      });

      expect(result).toEqual({
        id: 1,
        name: 'Test',
        commonProp: 'value',
        extraProp: 'default',
      });
    });
  });

  describe('Type Safety', () => {
    interface Source {
      id: number;
      value: string;
    }

    interface Destination {
      userId: number;
      transformedValue: boolean;
      requiredProp: string;
    }

    it('should error when required property is missing', () => {
      const excludedProperties = ['id', 'value'] as const;
      mapObject<Source, Destination, typeof excludedProperties>({
        sourceObject: { id: 1, value: 'test' },
        // @ts-expect-error - missing requiredProp
        mapConfiguration: {
          userId: 'id',
          transformedValue: (src) => src.value.length > 0,
        },
        options: {
          excludedProperties,
        },
      });
    });

    it('should error when type mismatch', () => {
      const excludedProperties = ['age', 'name', 'id', 'value'] as const;
      mapObject<Source, Destination, typeof excludedProperties>({
        sourceObject: { id: 1, value: 'test' },
        mapConfiguration: {
          userId: 'id',
          // @ts-expect-error - transformedValue should be boolean
          transformedValue: (src) => src.value, // returns string instead of boolean
          requiredProp: 'value',
        },
        options: {
          excludedProperties,
        },
      });
    });

    it('should error when source property is not exist', () => {
      const excludedProperties = ['id', 'value'] as const;
      mapObject<Source, Destination, typeof excludedProperties>({
        sourceObject: { id: 1, value: 'test' },
        mapConfiguration: {
          userId: 'id',
          // @ts-expect-error - nonexist in source object
          transformedValue: 'nonexist',
          requiredProp: 'value',
        },
        options: {
          excludedProperties,
        },
      });
    });
  });

  describe('Configuration Options', () => {
    interface Source {
      id: number;
      name: string;
      value: string;
    }

    interface Destination {
      id: number;
      name: string;
      transformed: string;
      optional?: string;
    }

    describe('excludedProperties', () => {
      it('should exclude usually valid property if it is added to excluded', () => {
        const excludedProperties = ['value', 'name'] as const;
        const source = { id: 1, name: 'Test', value: 'original' };
        const result = mapObject<
          Source,
          Destination,
          typeof excludedProperties
        >({
          sourceObject: source,
          mapConfiguration: {
            transformed: 'value',
          },
          options: {
            excludedProperties,
          },
        });

        expect(result).toEqual({
          id: 1,
          transformed: 'original',
        });
      });

      it('should exclude specified properties', () => {
        const excludedProperties = ['value'] as const;
        const source = { id: 1, name: 'Test', value: 'original' };
        const result = mapObject<
          Source,
          Destination,
          typeof excludedProperties
        >({
          sourceObject: source,
          mapConfiguration: {
            transformed: 'value',
          },
          options: {
            excludedProperties,
          },
        });

        expect(result).toEqual({
          id: 1,
          name: 'Test',
          transformed: 'original',
        });
      });

      it('should warn for missing property in excluded array', () => {
        const excludedProperties = [] as const;
        const source = { id: 1, name: 'Test', value: 'original' };
        const result = mapObject<
          Source,
          Destination,
          typeof excludedProperties
        >({
          sourceObject: source,
          mapConfiguration: {
            transformed: 'value',
          },
          options: {
            //@ts-expect-error missing value property
            excludedProperties,
          },
        });

        expect(result).toEqual({
          id: 1,
          name: 'Test',
          transformed: 'original',
          value: 'original',
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle optional destination properties', () => {
      interface Source {
        id: number;
      }

      interface Destination {
        id: number;
        optional?: string;
      }

      const source = { id: 1 };
      const excludedProperties = ['value'] as const;
      const result = mapObject<Source, Destination, typeof excludedProperties>({
        sourceObject: source,
        mapConfiguration: {
          // No mapping needed for optional property
        },
        options: {
          excludedProperties,
        },
      });

      expect(result).toEqual({
        id: 1,
      });
    });
  });

  describe('mapObject return type exclusion', () => {
    interface Source {
      id: number;
      name: string;
      email: string;
      age: number;
    }

    interface Destination {
      id: number;
      fullName: string;
      email: string;
      age: number;
      isAdult: boolean;
    }

    const sourceData: Source = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    };

    it('should exclude properties specified in excludedProperties from return type', () => {
      const result = mapObject<
        Source,
        Destination,
        readonly ['email', 'age', 'name']
      >({
        sourceObject: sourceData,
        mapConfiguration: {
          fullName: 'name',
          isAdult: (source) => source.age >= 18,
        },
        options: {
          excludedProperties: ['email', 'age', 'name'] as const,
        },
      });

      // These should work - properties not excluded
      expect(result.id).toBe(1);
      expect(result.fullName).toBe('John Doe');
      expect(result.isAdult).toBe(true);

      // These should cause TypeScript errors - properties are excluded from return type
      // @ts-expect-error - email should not exist in return type
      expect(result.email).toBeUndefined();

      // @ts-expect-error - age should not exist in return type
      expect(result.age).toBeUndefined();
    });

    it('should handle empty exclusion array', () => {
      const result = mapObject<Source, Destination, readonly ['name']>({
        sourceObject: sourceData,
        mapConfiguration: {
          fullName: 'name',
          isAdult: (source) => source.age >= 18,
        },
        options: {
          excludedProperties: ['name'] as const,
        },
      });

      // All properties should be accessible when no exclusions
      expect(result.id).toBe(1);
      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(25);
      expect(result.isAdult).toBe(true);
    });

    it('should exclude single property from return type', () => {
      const result = mapObject<Source, Destination, readonly ['email', 'name']>(
        {
          sourceObject: sourceData,
          mapConfiguration: {
            fullName: 'name',
            isAdult: (source) => source.age >= 18,
          },
          options: {
            excludedProperties: ['email', 'name'] as const,
          },
        },
      );

      // These should work
      expect(result.id).toBe(1);
      expect(result.fullName).toBe('John Doe');
      expect(result.age).toBe(25);
      expect(result.isAdult).toBe(true);

      // This should cause TypeScript error
      // @ts-expect-error - email should not exist in return type
      expect(result.email).toBeUndefined();
    });

    it('should return full TDestination type when excludedProperties contains no valid keys', () => {
      // excludedProperties contains keys that don't exist in TDestination
      const result = mapObject<
        Source,
        Destination,
        readonly ['nonExistent', 'alsoNotThere', 'name']
      >({
        sourceObject: sourceData,
        mapConfiguration: {
          fullName: 'name',
          isAdult: (source) => source.age >= 18,
        },
        options: {
          excludedProperties: ['nonExistent', 'alsoNotThere', 'name'] as const,
        },
      });

      // All properties should be accessible since none were actually excluded
      expect(result.id).toBe(1);
      expect(result.fullName).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(25);
      expect(result.isAdult).toBe(true);
    });

    it('should only exclude properties that exist in TDestination', () => {
      // Mix of valid and invalid exclusion keys
      const result = mapObject<
        Source,
        Destination,
        readonly ['email', 'nonExistent', 'age', 'alsoNotThere', 'name']
      >({
        sourceObject: sourceData,
        mapConfiguration: {
          fullName: 'name',
          isAdult: (source) => source.age >= 18,
        },
        options: {
          excludedProperties: [
            'email',
            'nonExistent',
            'age',
            'alsoNotThere',
            'name',
          ] as const,
        },
      });

      // These should work - properties not excluded or don't exist in destination
      expect(result.id).toBe(1);
      expect(result.fullName).toBe('John Doe');
      expect(result.isAdult).toBe(true);

      // These should cause TypeScript errors - only valid destination properties are excluded
      // @ts-expect-error - email should not exist in return type
      expect(result.email).toBeUndefined();

      // @ts-expect-error - age should not exist in return type
      expect(result.age).toBeUndefined();

      interface ComplexSource {
        firstName: string;
        lastName: string;
        birthYear: number;
        emailAddress: string;
        isActive: boolean;
      }

      interface ComplexDestination {
        name: string;
        age: number;
        email: string;
        status: 'active' | 'inactive';
        metadata: { processed: boolean };
      }

      const complexSource: ComplexSource = {
        firstName: 'Jane',
        lastName: 'Smith',
        birthYear: 1990,
        emailAddress: 'jane@example.com',
        isActive: true,
      };

      const result2 = mapObject<
        ComplexSource,
        ComplexDestination,
        readonly [
          'email',
          'metadata',
          'firstName',
          'lastName',
          'birthYear',
          'isActive',
          'emailAddress',
        ]
      >({
        sourceObject: complexSource,
        mapConfiguration: {
          name: (source) => `${source.firstName} ${source.lastName}`,
          age: (source) => new Date().getFullYear() - source.birthYear,
          email: 'emailAddress',
          status: (source) => (source.isActive ? 'active' : 'inactive'),
          metadata: () => ({ processed: true }),
        },
        options: {
          excludedProperties: [
            'email',
            'metadata',
            'firstName',
            'lastName',
            'birthYear',
            'isActive',
            'emailAddress',
          ] as const,
        },
      });

      // These should work
      expect(result2.name).toBe('Jane Smith');
      expect(result2.age).toBeGreaterThan(0);
      expect(result2.status).toBe('active');

      // These should cause TypeScript errors
      // @ts-expect-error - email should not exist in return type
      expect(result2.email).toBeUndefined();

      // @ts-expect-error - metadata should not exist in return type
      expect(result2.metadata).toBeUndefined();
    });

    // Type-only test to ensure proper inference
    it('should properly infer return types', () => {
      // This is more of a compilation test
      const _withExclusions = mapObject<
        Source,
        Destination,
        readonly ['email', 'name']
      >({
        sourceObject: sourceData,
        mapConfiguration: { fullName: 'name', isAdult: () => true },
        options: { excludedProperties: ['email', 'name'] as const },
      });

      const _withoutExclusions = mapObject<
        Source,
        Destination,
        readonly ['name']
      >({
        sourceObject: sourceData,
        mapConfiguration: { fullName: 'name', isAdult: () => true },
        options: { excludedProperties: ['name'] },
      });

      // Type assertions to verify inference
      type WithExclusions = typeof _withExclusions;
      type WithoutExclusions = typeof _withoutExclusions;

      // These type checks will fail at compile time if types are wrong
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed
      const _check1: WithExclusions extends { email: any } ? never : true =
        true;
      const _check2: WithoutExclusions extends { email: string }
        ? true
        : never = true;

      expect(_check1).toBe(true);
      expect(_check2).toBe(true);
    });
  });
});
