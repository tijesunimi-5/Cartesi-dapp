import { createApp } from "@deroll/app";
import { createWallet } from "@deroll/wallet";
import { getAddress, hexToString, stringToHex } from "viem";

const app = createApp({url: process.env.ROLLUP_HTTP_SERVER_URL || "http://127.0.0.1:5004"})

const wallet = createWallet();
app.addAdvanceHandler(wallet.handler)

app.addAdvanceHandler( async ({metadata, payload}) => {
  const sender = getAddress(metadata.msg_sender);
  try {
    const jsonpayload = JSON.parse(hexToString(payload))
    if (jsonpayload.method === "ether_withdraw") {
      const amountToWithdraw = BigInt(jsonpayload.amount)
      const voucher = wallet.withdrawEther(sender, amountToWithdraw)
      await app.createVoucher(voucher)
      return "accept"
    } 
  } catch {
    app.createReport({payload: stringToHex(String(e))})
    return "reject"
  }
  return "accept"
})

app.addInspectHandler( async ({payload}) => {
  const url = hexToString(payload).split("/")//rollup/balance/address

  const eth_balance = wallet.etherBalanceOf(url[1])
    await app.createReport( {payload: stringToHex(String(eth_balance))})
})

app.start().catch((e) => {
  console.error(e)
  process.exit(1)
})