/**
 * Helper functions for Swagger/OpenAPI examples
 * Converts TypeScript objects with Date instances to JSON-serializable format
 */

/**
 * Recursively converts Date objects to ISO string format for Swagger examples
 */
export function serializeDatesForSwagger<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDatesForSwagger(item));
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeDatesForSwagger((obj as any)[key]);
      }
    }
    return serialized;
  }

  return obj;
}

/**
 * Creates Swagger example from sample data with proper date serialization
 */
export function createSwaggerExample<T>(sampleData: T): any {
  return serializeDatesForSwagger(sampleData);
}

