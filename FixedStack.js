class FixedStack {
    constructor(maxLength, pinnedCount = 2) {
        this.maxLength = maxLength;
        this.pinnedCount = pinnedCount;
        this.stack = [];
    }

    push(value) {
        if (this.stack.length >= this.maxLength) {
            this.stack.splice(this.pinnedCount, 1); // Remove oldest item after pinned
        }
        this.stack.push(value);
    }

    getOldest() {
        return this.stack.slice(0, this.pinnedCount);
    }

    get length() {
        return this.stack.length;
    }
}

module.exports = FixedStack