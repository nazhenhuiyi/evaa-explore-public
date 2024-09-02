module.exports = {
    apps: [
        {
            name: "indexer",
            script: "./src/indexer/indexTransaction.ts",
            interpreter: "node",
            interpreterArgs: "--import tsx",
        },
    ],
};