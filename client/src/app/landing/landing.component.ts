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

  constructor(private contractsService: ContractsService) {
    this.lotteryContractAddress = ''
    this.isBettingWindowOpen = false
  }

  async ngOnInit(): Promise<void> {
    this.lotteryContractAddress = this.contractsService.lotteryContractAddress
    this.isBettingWindowOpen = await this.contractsService.isBettingWindowOpen()
  }
}
