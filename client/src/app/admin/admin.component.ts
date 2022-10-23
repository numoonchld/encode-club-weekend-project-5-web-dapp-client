import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'

declare var window: any

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  isOwnerLoggedIn: Boolean

  constructor(private contractsService: ContractsService) {
    this.isOwnerLoggedIn = false
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
}
