import * as fs from 'fs';
import chalk from 'chalk';
import {ethers} from "ethers";

//SETTINGS
const initialIndex = 1000;
const zerosPadding = 4;
const iterations = 8999; //stop after that many iterations
const DELAY = 0; //seconds between calls. 10 reqs per min threshold
// const _FILE = "RESULTS/results-000.json";
// const _FILE = "RESULTS/results-0000.json";
// const _FILE = "RESULTS/results-AAA.json";
// const _FILE = "RESULTS/results-AAAA.json";
const _FILE = "RESULTS/results-NAMES.json";
// const _FILE = "RESULTS/results-3000.json";
// const _DICTIONARY_FILE = "dictionary/words_dictionary.json";
const _DICTIONARY_FILE = "dictionary/names.json";
const MIN_WORD_LENGTH = 3;
const RESULTS = new Map(JSON.parse(fs.readFileSync(_FILE, 'utf8')));
const DICTIONARY_RAW = JSON.parse(fs.readFileSync(_DICTIONARY_FILE, 'utf8'));
const DICTIONARY = [...DICTIONARY_RAW];

//RPC PROVIDER
const PROVIDER = new ethers.providers.JsonRpcProvider("http://207.180.218.208:8545", "homestead");

//INIT
checkEnsDomainByDictionary();

// FUNCTIONS
async function checkEnsDomainByDictionary() {

    const balance = await PROVIDER.getBalance("0xe5Fb31A5CaEE6a96de393bdBF89FBe65fe125Bb3");
    const balanceInEth = ethers.utils.formatEther(balance);
    console.log(balanceInEth);

    const tx = await PROVIDER.getTransaction("0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060");
    console.log(tx);

    const block = await PROVIDER.getBlock(46147);
    console.log(block);
    console.log(new Date(block.timestamp * 1000).toISOString());

    process.exit(1);

    try {
        if (DICTIONARY.length === 0) {
            console.log('NO DICTIONARY PROVIDED');
            process.exit(1);
        }

        for (let i = 0; i < DICTIONARY.length; i++) {
            const word = DICTIONARY[i].toLowerCase();
            if (word.length < MIN_WORD_LENGTH) {
                continue;
            }
            const domain = `${word}.eth`;
            //check if we have a data already
            if (RESULTS.has(domain)) {
                continue;
            }

            const address = await PROVIDER.resolveName(domain);

            console.log(`${i}: ${chalk.green.bold(domain)} -> ${!address ? chalk.red.bold("FREE") : chalk.yellow(address)}`)

            RESULTS.set(domain, {
                "timestamp": !address ? 0 : new Date().getTime(),
                "data": !address ? "FREE" : "taken"
            });

            updateFile()
            await sleep(1000 * DELAY);
        }
        console.log('FINISHED');
        process.exit(1);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

function updateFile() {
    const sorted = Array.from(RESULTS).sort((a, b) => a[1].timestamp - b[1].timestamp);
    let data = JSON.stringify(sorted, null, 2);
    fs.writeFileSync(_FILE, data);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}




