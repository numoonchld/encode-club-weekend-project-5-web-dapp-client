import { Component } from '@angular/core'
import { ContractsService } from './contracts.service'

declare var window: any

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'client'
  isWalletLoggedIn: Boolean

  constructor(private contractsService: ContractsService) {
    this.isWalletLoggedIn = false
  }

  // connect to metamask wallet on button click
  async connectMetamaskWallet() {
    this.isWalletLoggedIn = this.contractsService.isLoggedIn

    if (!this.isWalletLoggedIn) {
      const { ethereum } = window
      await this.contractsService.connectToWallet(ethereum)
      this.isWalletLoggedIn = this.contractsService.isLoggedIn
      window.alert('Connected to Wallet!')
    }
  }
}
