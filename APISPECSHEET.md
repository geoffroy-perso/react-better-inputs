# API Specifications
*For the backend part of the endless scroll component.*

## Before note

This document is about building a server api to feed the endless scroller component with content. Note you don't have to make your backend comply directly to this spec. It is possible to create a frontend connector, to convert I/O from your server to the component.

## Database specifications

The current implementation of endless scroller assumes that the database runs on **index based pagination**. 

Some DBMS, such as Firestore, allow document id based pagination. This way is more efficient to prevent false connections when database gets unexpectedly updated, but is also more tricky to implement especially for backward requests. It is planned to add support for document id based pagination in the future.

## Api Handler specification
*Example in typescript*
```typescript
function handler({start: number, end: number, ...queryParams}) {
    return ({
        queryResults: Array<{key: any, [x: string]: any}> | null,
        flags: {
            endOfResults: Boolean,
            [x: string]: any
        },
        boundaries: {
            start: number,
            end: number
        },
        [x: string]: any
    });
}
```

### Input

Only two parameters are required : start and end, both numbers. They tell the database how we want to paginate our data. An api call will load data from index start to index end.

Some optional queryParams can be passed for the api needs. They can be anything in the form of key-value pairs.

### Output

Output only requires flags and boundaries to be properly set, since some languages like Go convert empty arrays to null.

Boundaries should be the actual index limits of the returned dataset, and flags contain a single endOfResults to inform the component there is no content to fetch anymore.

Other parameters can be passed, and will be returned to a postLoadAction function in the component properties. This function only fires if fetch was successful.

## Copyright
2020 Kushuh - MIT license