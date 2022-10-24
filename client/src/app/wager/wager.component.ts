import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'
import { FormBuilder, Validators } from '@angular/forms'

declare var window: any

@Component({
  selector: 'app-wager',
  templateUrl: './wager.component.html',
  styleUrls: ['./wager.component.css'],
})
export class WagerComponent implements OnInit {
  isAttemptingToPurchaseTokens: Boolean
  isBettingWindowOpen: Boolean
  getLotteryTokenBalanceForCurrentWallet: string

  buyTokensForm = this.fb.group({
    lotteryTokenAmount: ['', [Validators.required]],
  })

  constructor(
    private contractsService: ContractsService,
    private fb: FormBuilder,
  ) {
    this.isAttemptingToPurchaseTokens = false
    this.isBettingWindowOpen = false
    this.getLotteryTokenBalanceForCurrentWallet = ''
  }

  async ngOnInit(): Promise<void> {
    this.isBettingWindowOpen = await this.contractsService.isBettingWindowOpen()
  }

  async attemptTokenPurchase() {
    this.isAttemptingToPurchaseTokens = true
    const { ethereum } = window

    const { lotteryTokenAmount } = this.buyTokensForm.value
    // console.log({ lotteryTokenAmount })

    if (Number.isNaN(parseFloat(lotteryTokenAmount!))) {
      console.log('Enter valid token amount!')
      window.alert('Enter valid token amount!')
      this.isAttemptingToPurchaseTokens = false
    }

    const isPurchaseSuccess = await this.contractsService.purchaseLotteryTokens(
      ethereum,
      lotteryTokenAmount!,
    )

    if (isPurchaseSuccess) await this.ngOnInit()
    else window.alert('Token purchase unsuccessful - please try later!')
    this.isAttemptingToPurchaseTokens = false
  }

  async getLotteryTokenBalance() {
    const { ethereum } = window
    await this.contractsService.getLotteryTokenBalance(ethereum)
  }
}
