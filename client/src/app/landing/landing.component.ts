import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'

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

  constructor(private contractsService: ContractsService) {
    this.lotteryContractAddress = ''
    this.isBettingWindowOpen = false
    this.isLotteryRollAvailable = false
    this.isAttemptingLotteryRoll = false
  }

  async ngOnInit(): Promise<void> {
    this.lotteryContractAddress = this.contractsService.lotteryContractAddress
    this.isBettingWindowOpen = await this.contractsService.isBettingWindowOpen()
    this.isLotteryRollAvailable = await this.contractsService.isLotteryRollAvailable()
  }

  async rollLottery() {
    this.isAttemptingLotteryRoll = true
    const isLotteryRollSuccess = await this.contractsService.rollLottery()
    if (isLotteryRollSuccess) {
      window.alert('Lottery roll successful!')
      this.isAttemptingLotteryRoll = false
      await this.ngOnInit()
    }
  }
}
