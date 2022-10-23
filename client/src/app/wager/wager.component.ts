import { Component, OnInit } from '@angular/core'
import { ContractsService } from '../contracts.service'
import { FormBuilder, Validators } from '@angular/forms'

@Component({
  selector: 'app-wager',
  templateUrl: './wager.component.html',
  styleUrls: ['./wager.component.css'],
})
export class WagerComponent implements OnInit {
  isAttemptingtoPurchaseTokens: Boolean

  buyTokensForm = this.fb.group({
    lotteryTokenAmount: ['', [Validators.required]],
  })

  constructor(
    private contractsService: ContractsService,
    private fb: FormBuilder,
  ) {
    this.isAttemptingtoPurchaseTokens = false
  }

  ngOnInit(): void {}

  async attemptTokenPurchase() {}
}
