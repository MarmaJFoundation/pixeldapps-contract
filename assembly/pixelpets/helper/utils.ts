@nearBindgen
export class PxBalance {
    constructor(
        public egg_common: u32,
        public egg_rare: u32,
        public egg_epic: u32,
        public egg_legendary: u32) {
    }
}

@nearBindgen
export class PxBalanceWithToken {
    constructor(
        public pixeltoken: string,
        public egg_common: u32,
        public egg_rare: u32,
        public egg_epic: u32,
        public egg_legendary: u32) {
    }
}

export const empty_PxBalance = new PxBalance(0, 0, 0, 0);