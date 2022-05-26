import * as fs from 'fs';
import chalk from 'chalk';
import {ethers} from "ethers";
import {namehash} from "ethers/lib/utils.js";
import 'dotenv/config';

//SETTINGS
const DELAY = 0; //seconds between calls. 10 reqs per min threshold
const _RESULTS_DIRECTORY = "RESULTS";
const _RESULTS_FILE = `${_RESULTS_DIRECTORY}/results-${new Date().getTime()}-.txt`;
const _DICTIONARY_FILE = "dictionary/names.json";
const MIN_WORD_LENGTH = 3;
const DICTIONARY_RAW = JSON.parse(fs.readFileSync(_DICTIONARY_FILE, 'utf8'));
const DICTIONARY = [...DICTIONARY_RAW];
let STREAM;
let COUNT = 0;

//RPC PROVIDER
// Use the mainnet
const network = "homestead";

// Specify your own API keys
// Each is optional, and if you omit it the default
// API key for that service will be used.
const PROVIDER = ethers.getDefaultProvider(network, {
    etherscan: process.env.ETHERSCAN_API_KEY,
    infura: process.env.INFURA_PROJECT_ID,
    alchemy: process.env.ALCHEMY_API_KEY,
    pocket: {
        applicationId: process.env.POCKET_APPLICATION_ID,
        applicationSecretKey: process.env.POCKET_APPLICATION_SECRET,
    }
});

//CONTRACT SETUP
//https://etherscan.io/address/0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e#code

// A Human-Readable ABI; for interacting with the contract, we
// must include any fragment we wish to use
const _ABI = [
    "function owner(bytes32 node) external view returns (address)",
    "function recordExists(bytes32 node) external view returns (bool)"
];

// This can be an address or an ENS name
const _CONTRACT = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

// Read-Only; By connecting to a Provider, allows:
// - Any constant function
// - Querying Filters
// - Populating Unsigned Transactions for non-constant methods
// - Estimating Gas for non-constant (as an anonymous sender)
// - Static Calling non-constant methods (as anonymous sender)
const _ERC20 = new ethers.Contract(_CONTRACT, _ABI, PROVIDER);

//INIT
checkEnsDomainByDictionary();

// FUNCTIONS
async function checkEnsDomainByDictionary() {
    try {
        if (DICTIONARY.length === 0) {
            console.log('NO DICTIONARY PROVIDED');
        }

        STREAM = fs.createWriteStream(_RESULTS_FILE, {flags: 'a'});

        for (let i = 0; i < DICTIONARY.length; i++) {
            const word = DICTIONARY[i].toLowerCase();
            if (word.length < MIN_WORD_LENGTH) {
                continue;
            }
            const domain = `${word}.eth`;
            const isTaken = await _ERC20.recordExists(namehash(domain));

            console.log(`${i}: ${chalk.green.bold(domain)} -> ${!isTaken ? chalk.red.bold("FREE") : chalk.yellow("TAKEN")}`)

            if (!isTaken) {
                STREAM.write(`${domain}\n`);
                COUNT++;
            }

            await sleep(1000 * DELAY);
        }

        STREAM.end();
        console.log('FINISHED');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit();
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function exitHandler(options, exitCode) {
    if (options.cleanup) {
        if (STREAM) {
            STREAM.end();
        }
        if (COUNT === 0) {
            fs.unlinkSync(_RESULTS_FILE);
        }
    }
    if (options.exit) {
        process.exit()
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));




