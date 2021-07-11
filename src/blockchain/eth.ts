// import W3 from "web3";
// import config from "../util/config";
//
// const erc20ABI = [
//     {
//         constant: true,
//         inputs: [],
//         name: "name",
//         outputs: [
//             {
//                 name: "",
//                 type: "string"
//             }
//         ],
//         payable: false,
//         type: "function" as "function"
//     },
//     {
//         constant: true,
//         inputs: [],
//         name: "decimals",
//         outputs: [
//             {
//                 name: "",
//                 type: "uint8"
//             }
//         ],
//         payable: false,
//         type: "function" as "function"
//     },
//     {
//         constant: true,
//         inputs: [
//             {
//                 name: "_owner",
//                 type: "address"
//             }
//         ],
//         name: "balanceOf",
//         outputs: [
//             {
//                 name: "balance",
//                 type: "uint256"
//             }
//         ],
//         payable: false,
//         type: "function" as "function"
//     },
//     {
//         constant: true,
//         inputs: [],
//         name: "symbol",
//         outputs: [
//             {
//                 name: "",
//                 type: "string"
//             }
//         ],
//         payable: false,
//         type: "function" as "function"
//     }
// ];
//
// const web3 = new W3(new W3.providers.HttpProvider(config.ethProvider));
//
// export const getEthBalance = async (address: string): Promise<string> => {
//     return await web3.eth.getBalance(address);
// };
//
// export const getErcBalance = async (address: string, token: string): Promise<string> => {
//     const contract = new web3.eth.Contract(erc20ABI, token);
//     // @ts-ignore
//     const result = await contract.balanceOf(address);
//
//     return web3.utils.toBN(result).toString();
// };
//
// // todo: this
// export const getErcName = async (address: string): Promise<string> => {
//     return await web3.eth.getBalance(address);
// };
