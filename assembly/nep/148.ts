//NEP-148
@nearBindgen
export class FungibleTokenMetadata {

    constructor(
        public spec: string,
        public name: string,
        public symbol: string,
        public icon: string,
        public reference: string,
        public reference_hash: string,
        public decimals: number) {
    }
}

export function ft_metadata_impl(): FungibleTokenMetadata {
    return new FungibleTokenMetadata("ft-1.0.0", "Pixeltoken", "PXT", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANdJREFUWIXll70RwjAMhWUuNGwARVgEmuyQJRgo7AA7uGESGioaGlpTcK+w7nR+gcIyfJ1zys/7dHKSsO53SSqyqHlzEZFu7gm364Wq22z3VF07BpB8CANXn971JRP+Dejk8fSgLoz6kgm/Btjk58MqW4/TM6svmfBrQIOkSAiO92W2Hmc+gF8D6BV6h17qhOxUWPg18C16OizaN2AlxXTEFEWkxZ2QRe8DoJQctG8AIDH4vS8iFjY5aM8Au8Ox+DdgvRUBO+8W/g0AbUIf/5TqBsLf/x2/ADJHSOenTxC2AAAAAElFTkSuQmCC", "", "", 6);
}