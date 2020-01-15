import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})

export class HeaderComponent implements OnInit {
  showSettingModal = false;
  openSetting =  false;

  ngOnInit() {
  }

  constructor() {}

  popSettings() {
    this.openSetting = true;
  }

  onSettingSave() {
    this.openSetting = false;
  }
}
