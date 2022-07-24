import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'

import { ToDoListComponent } from './features/to-do-list/to-do-list.component'
import { HttpClientModule } from '@angular/common/http'
import { TabViewModule } from 'primeng/tabview'
import { ButtonModule } from 'primeng/button'
import { OrderListModule } from 'primeng/orderlist'
import { DialogModule } from 'primeng/dialog'
import { InputTextModule } from 'primeng/inputtext'
import { FormsModule } from '@angular/forms'
import { ServiceWorkerModule } from '@angular/service-worker'
import { environment } from '../environments/environment'
import { CalendarModule } from 'primeng/calendar'


@NgModule({
  declarations: [
    AppComponent,
    ToDoListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    OrderListModule,
    TabViewModule,
    ButtonModule,
    DialogModule,
    BrowserAnimationsModule,
    InputTextModule,
    FormsModule,
    CalendarModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
