type MapperFunction<TSource, TReturn> = (source: TSource) => TReturn;

type RequiredKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- need empty object
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type CommonProperties<TSource, TDestination> = keyof TSource &
  keyof TDestination;

type MapperOptions<
  // eslint-disable-next-line @typescript-eslint/naming-convention -- for future use
  _TSource extends object,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- for future use
  _TDestination extends object,
  ExcludeArrayType,
> = {
  excludedProperties: ExcludeArrayType;
};

type MapConfiguration<
  TSource,
  TDestination,
  TExcluded extends keyof TDestination = never,
> = {
  [K in Exclude<
    RequiredKeys<TDestination>,
    TExcluded | CommonProperties<TSource, TDestination>
  >]-?: keyof TSource | MapperFunction<TSource, TDestination[K]>;
} & {
  [K in keyof TDestination]?:
    | keyof TSource
    | MapperFunction<TSource, TDestination[K]>;
};

type ExtraKeys<TSource, TDestination> = Exclude<
  keyof TSource,
  keyof TDestination
>;

type MissingKeys<
  Required extends string,
  Provided extends readonly string[],
> = Exclude<Required, Provided[number]>;

type ValidateArrayKeys<
  Required extends string,
  Provided extends readonly string[],
> =
  MissingKeys<Required, Provided> extends never
    ? readonly string[]
    : {
        error: `Missing key: ${MissingKeys<Required, Provided> & string}`;
        missing: MissingKeys<Required, Provided>;
      };

interface MapObjectParams<
  TSource extends object,
  TDestination extends object,
  ExcludedProps extends readonly string[] | undefined,
  RequiredExcludedKeys extends string = Extract<
    ExtraKeys<TSource, TDestination>,
    string
  >,
  CheckExcluded extends
    | readonly string[]
    | {
        error: string;
        missing: string;
      } = ExcludedProps extends readonly string[]
    ? ValidateArrayKeys<RequiredExcludedKeys, ExcludedProps>
    : readonly string[],
> {
  sourceObject: TSource;
  mapConfiguration: MapConfiguration<TSource, TDestination>;
  options: CheckExcluded extends readonly string[]
    ? MapperOptions<TSource, TDestination, ExcludedProps>
    : CheckExcluded;
}

export default function mapObject<
  TSource extends object,
  TDestination extends object,
  ExcludeArrayType extends readonly string[] | undefined,
>(
  params: MapObjectParams<TSource, TDestination, ExcludeArrayType>,
): ExcludeArrayType extends readonly string[]
  ? Extract<ExcludeArrayType[number], keyof TDestination> extends never
    ? TDestination
    : Omit<TDestination, Extract<ExcludeArrayType[number], keyof TDestination>>
  : TDestination {
  const { sourceObject, mapConfiguration, options } = params;

  // Type guard to ensure options has excludedProperties
  const excludedProperties =
    options && 'excludedProperties' in options
      ? (options.excludedProperties ?? [])
      : [];

  // Updated return type calculation
  type ReturnType = ExcludeArrayType extends readonly string[]
    ? Extract<ExcludeArrayType[number], keyof TDestination> extends never
      ? TDestination
      : Omit<
          TDestination,
          Extract<ExcludeArrayType[number], keyof TDestination>
        >
    : TDestination;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed
  const destination: ReturnType = {} as any;

  // Get all properties we should process
  const propertiesToProcess = [
    ...new Set([
      ...(Object.keys(mapConfiguration) as Array<keyof TDestination>),
      ...(Object.keys(sourceObject) as Array<
        keyof TSource & keyof TDestination
      >),
    ]),
  ];

  for (const destKey of propertiesToProcess) {
    // Skip excluded properties
    if ((excludedProperties as readonly PropertyKey[]).includes(destKey)) {
      continue;
    }

    const mapping = mapConfiguration[destKey];

    if (typeof mapping === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any needed
      (destination as any)[destKey] = mapping(sourceObject);
    } else if (typeof mapping === 'string' && mapping in sourceObject) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any needed
      (destination as any)[destKey] = sourceObject[mapping as keyof TSource];
    } else if (destKey in sourceObject) {
      // Automatically map when property exists in source and destination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any needed
      (destination as any)[destKey] =
        sourceObject[destKey as unknown as keyof TSource];
    }
  }

  return destination as ReturnType;
}
