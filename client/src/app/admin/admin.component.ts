import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'
import { FormBuilder, Validators } from '@angular/forms'

import { ethers } from 'ethers'

declare var window: any

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  isOwnerLoggedIn: Boolean
  isAttemptingLotteryStart: Boolean

  startLotteryForm = this.fb.group({
    closingTime: ['', [Validators.required]],
    baseWinningWithdrawFee: ['', [Validators.required]],
  })

  constructor(
    private contractsService: ContractsService,
    private fb: FormBuilder,
  ) {
    this.isOwnerLoggedIn = false
    this.isAttemptingLotteryStart = false
  }

  async ngOnInit(): Promise<void> {
    const { ethereum } = window
    await this.contractsService.checkWalletConnection(ethereum)
    await this.contractsService.loadContractOwner(ethereum)
    this.isOwnerLoggedIn = this.contractsService.determineIsCurrentAccountLotteryContractOwner()
    // console.log(this.isOwnerLoggedIn)

    // TODO: Debug this update isOwnerLoggedIn state without page refresh
    /* 
    ethereum.on('accountsChanged', async () => {
      console.log('account change detected!')
      await this.contractsService.checkWalletConnection(ethereum)
      this.isOwnerLoggedIn = this.contractsService.determineIsCurrentAccountLotteryContractOwner()
      console.log('account change state', this.isOwnerLoggedIn)
    })
    */
  }

  async attemptLotteryStart() {
    this.isAttemptingLotteryStart = true

    const { ethereum } = window
    const { closingTime, baseWinningWithdrawFee } = this.startLotteryForm.value

    if (!closingTime || !baseWinningWithdrawFee) {
      window.alert('Form not correctly filled - try again!')
      this.isAttemptingLotteryStart = false
      return
    }
    console.log({ closingTime, baseWinningWithdrawFee })

    const txn = await this.contractsService.startLottery(
      ethereum,
      parseInt(closingTime!),
      ethers.utils.parseEther(baseWinningWithdrawFee!),
    )
  }
}
