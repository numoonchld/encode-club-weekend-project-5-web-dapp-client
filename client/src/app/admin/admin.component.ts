import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'
import { FormBuilder, Validators } from '@angular/forms'

import { NgZone } from '@angular/core'
import { Router } from '@angular/router'

import { ethers } from 'ethers'
import currentEpoch from 'src/helpers/currentEpoch'

declare var window: any

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  isOwnerLoggedIn: Boolean
  isAttemptingLotteryStart: Boolean
  isLoadingAccumulatedFees: Boolean
  accumulatedFees: string
  isLotteryStartAvailable: Boolean

  startLotteryForm = this.fb.group({
    durationInSeconds: ['', [Validators.required]],
    baseWinningWithdrawFee: ['', [Validators.required]],
  })

  constructor(
    private contractsService: ContractsService,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private router: Router,
  ) {
    this.isOwnerLoggedIn = false
    this.isAttemptingLotteryStart = false
    this.isLoadingAccumulatedFees = false
    this.accumulatedFees = ''
    this.isLotteryStartAvailable = false
  }

  async ngOnInit(): Promise<void> {
    const { ethereum } = window
    await this.contractsService.checkWalletConnection(ethereum)
    await this.contractsService.loadContractOwner(ethereum)
    this.isOwnerLoggedIn = this.contractsService.determineIsCurrentAccountLotteryContractOwner()
    this.accumulatedFees = await this.contractsService.getAccumulatedFees()
    this.isLotteryStartAvailable = await this.contractsService.isLotteryStartAvailable()
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
    const {
      durationInSeconds,
      baseWinningWithdrawFee,
    } = this.startLotteryForm.value

    if (!durationInSeconds || !baseWinningWithdrawFee) {
      window.alert('Form not correctly filled - try again!')
      this.isAttemptingLotteryStart = false
      return
    }
    console.log({ durationInSeconds, baseWinningWithdrawFee })

    const computedClosingTime = currentEpoch() + parseInt(durationInSeconds!)

    const isStartLotterySuccess = await this.contractsService.startLottery(
      ethereum,
      computedClosingTime,
      ethers.utils.parseEther(baseWinningWithdrawFee!),
    )

    if (isStartLotterySuccess) {
      window.alert('New lottery started!')
      this.isAttemptingLotteryStart = false
      this.ngZone.run(() => this.router.navigate(['/']))
    }

    this.isAttemptingLotteryStart = false
  }
}
