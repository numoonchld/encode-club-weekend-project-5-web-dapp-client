import { Component, OnInit } from '@angular/core'
import currentEpoch from '../../helpers/currentEpoch'
import { ContractsService } from '../contracts.service'

declare var window: any

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent implements OnInit {
  lotteryContractAddress: string
  isBettingWindowOpen: Boolean
  isLotteryRollAvailable: Boolean
  isAttemptingLotteryRoll: Boolean
  latestLotteryWinner: string
  lotteryTimeWindowCountdown: string
  countdownInterval: any

  constructor(private contractsService: ContractsService) {
    this.lotteryContractAddress = ''
    this.isBettingWindowOpen = false
    this.isLotteryRollAvailable = false
    this.isAttemptingLotteryRoll = false
    this.latestLotteryWinner = ''
    this.lotteryTimeWindowCountdown = ''
  }

  async ngOnInit(): Promise<void> {
    this.lotteryContractAddress = this.contractsService.lotteryContractAddress
    this.isBettingWindowOpen = await this.contractsService.isBettingWindowOpen()
    this.isLotteryRollAvailable = await this.contractsService.isLotteryRollAvailable()
    this.latestLotteryWinner = await this.contractsService.getLatestLotteryWinner()
    await this.setCountdownTimerFromClosingEpoch()
  }

  async rollLottery() {
    this.isAttemptingLotteryRoll = true
    const { ethereum } = window
    const isLotteryRollSuccess = await this.contractsService.rollLottery(
      ethereum,
    )
    if (isLotteryRollSuccess) {
      window.alert('Lottery roll successful!')
      await this.ngOnInit()
    }
    this.isAttemptingLotteryRoll = false
  }

  async setCountdownTimerFromClosingEpoch() {
    const closingEpochInSeconds = await this.contractsService.getClosingEpochTime()
    console.log(closingEpochInSeconds)

    this.countdownInterval = setInterval(() => {
      // this.lotteryTimeWindowCountdown =
      const currentUIEpoch = currentEpoch()
      const remainingBettingTIme = closingEpochInSeconds - currentUIEpoch
      console.log({ remainingBettingTIme })

      if (remainingBettingTIme < 0) {
        this.lotteryTimeWindowCountdown = '00h:00m:00s'
        clearInterval(this.countdownInterval)
      }
    }, 1000)
  }
}
