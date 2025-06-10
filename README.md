# Typescript object mapper

This function copies values from a source object to a destination object type, and it infers the correct type automatically.

For every non-optional field in the destination type, a corresponding mapping must be defined in the configuration. This can either be the name of a field from the source type or a function that takes the source object and returns a value.

Fields with the same name in both the source and destination types do not need to be added to the map explicitly.

Any field that exists in the source but not in the destination must be listed in the excludedProperties array. This will be checked at compile time.

You can also exclude properties from the destination object; they will be omitted from the resulting type.

## Example of usage:

```
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
```

For additional examples see test file.
