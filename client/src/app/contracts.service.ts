import { Injectable } from '@angular/core'
import { ethers } from 'ethers'

@Injectable({
  providedIn: 'root',
})
export class ContractsService {
  currentAccount: string
  isLoggedIn: Boolean
  // tokenContractAddress: string
  // tokenContractJSON: any
  // ballotContractJSON: any
  provider: ethers.providers.BaseProvider

  constructor() {
    this.currentAccount = ''
    this.isLoggedIn = false
    // this.tokenContractAddress = ''
    // this.tokenContractJSON = G11TokenJSON
    // this.ballotContractJSON = TokenizedBallotJSON
    // this.provider = ethers.getDefaultProvider('goerli')
    this.provider = ethers.getDefaultProvider('http://localhost:8545')
  }

  // get metamask account/signer/address
  async checkWalletConnection(ethereum: any) {
    try {
      if (!ethereum) {
        console.log('Install MetaMask!')
        window.alert('MetaMask needed to use this site!')
      } else {
        console.log('Ethereum object found!', ethereum)
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' })

      if (accounts.length !== 0) {
        const account = accounts[0]
        console.log('Found authorized account!', account)
        this.currentAccount = account

        this.isLoggedIn = true
        return true
      } else {
        console.log('No authorized account found!')
        this.isLoggedIn = false
        window.alert('Connect site to MetaMask account to use this page!')
        return false
      }
    } catch (error) {
      console.error(error)
      return false
    }
  }

  // connect to metamask on button click
  async connectToWallet(ethereum: any): Promise<string> {
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    })

    const account = accounts[0]
    this.currentAccount = account
    this.isLoggedIn = true
    return this.currentAccount
  }
}
