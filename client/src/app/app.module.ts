import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { WagerComponent } from './wager/wager.component'
import { AdminComponent } from './admin/admin.component'
import { LandingComponent } from './landing/landing.component'

@NgModule({
  declarations: [
    AppComponent,
    WagerComponent,
    AdminComponent,
    LandingComponent,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
