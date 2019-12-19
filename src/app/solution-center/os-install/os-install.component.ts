import { Component, OnInit } from '@angular/core';
import { Poller, Node, API_PATTERN, ADDR_PATTERN, REPO_PATTERN, IP_PATTERN, DNS_PATTERN } from 'app/models';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import {
  AlphabeticalComparator,
  DateComparator,
  ObjectFilterByKey,
  StringOperator
} from 'app/utils/inventory-operator';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { map, catchError } from 'rxjs/operators';

import * as _ from 'lodash';
import { CatalogsService } from 'app/services/rackhd/catalogs.service';
import { NodeService } from 'app/services/rackhd/node.service';
import { PollersService } from 'app/services/pollers.service';
import { WorkflowService } from 'app/services/rackhd/workflow.service';
import { JSONEditor } from 'app/utils/json-editor';
import { ObmService } from 'app/services/rackhd/obm.service';
import { SkusService } from 'app/services/rackhd/sku.service';
import { TagService } from 'app/services/rackhd/tag.service';

@Component({
  selector: 'app-os-install',
  templateUrl: './os-install.component.html',
  styleUrls: ['./os-install.component.scss']
})

export class OsInstallComponent implements OnInit {
  public OS_TYPE_VERSION = {};
  public OS_TYPE_NAME = {};
  public REPO_PLACE_HOLDER = {};

  public allNodes: Node[];
  public dataStore: Node[];
  public allOsTypes: string[];

  public diskOptions: string[];
  public networkDeviceOptions: string[];
  public diskOptionsReady: boolean;
  public modifyDefaultSetting: boolean;

  public payloadForm: FormGroup;
  public payloadJson: {};

  public selectedNodeId: string;
  public selectedNetworkDevice: string;
  public editor: any;
  public selectedRepoPlaceHolder: string;

  public enableOsinstall = false;
  public submitSuccess = false;
  public confirmSubmited = false;
  public enableNetworkSetting = false;

  public searchTerms = new Subject<string>();

  public selNodeStore: any[] = [];
  public filterFields = ['type', 'name', 'sku', 'id', 'obms', 'tags'];
  public filterLabels = ['Node Type', 'Node Name', 'SKU Name', 'Node ID', 'OBM Host', 'Tag Name'];
  public filterColumns = [4, 4, 4, 4, 4, 4];
  public selectedNode: any;
  public nodeStore: any[] = [];

  public submitInfo = { status: 'Are you sure to submit the workflow ?' };

  constructor(
    public nodeService: NodeService,
    public catalogsService: CatalogsService,
    public workflowService: WorkflowService,
    private obmService: ObmService,
    public skuService: SkusService,
    public tagService: TagService,
    private fb: FormBuilder,
  ) {
  }

  public ngOnInit() {
    this.OS_TYPE_VERSION = {
      esxi: ['6.5', '6', '5.5'],
      centos: ['7', '6.5'],
      rhel: ['7.0', '7.1', '7.2'],
      ubuntu: ['trusty', 'xenial', 'artful'],
    };
    this.OS_TYPE_NAME = {
      esxi: 'Graph.InstallESXi',
      centos: 'Graph.InstallCentOS',
      ubuntu: 'Graph.InstallUbuntu',
      rhel: 'Graph.InstallRHEL',
    };

    this.REPO_PLACE_HOLDER = {
      '': 'Select OS TYPE first.',
      'esxi': 'http://172.31.128.2:9090/common/esxi/6.5',
      'centos': 'http://172.31.128.2:9090/common/centos/7/os/x86_64',
      'ubuntu': 'http://172.31.128.2:9090/common/ubuntu/16.04',
      'rhel': 'http://172.31.128.2:9090/common/rhel/7.1/os/x86_64',
    };

    this.selectedRepoPlaceHolder = 'Select OS TYPE first.';

    const container = document.getElementById('jsoneditor');
    const options = { mode: 'code' };
    this.editor = new JSONEditor(container, options);

    this.allOsTypes = Object.keys(this.OS_TYPE_VERSION);
    this.modifyDefaultSetting = false;
    this.getAllNodes();
    this.createForm();

    const searchTrigger = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        this.searchIterm(term);
        return 'whatever';
      })
    );
    searchTrigger.subscribe();
  }

  public searchIterm(term: string): void {
    this.allNodes = this.dataStore;
    if (this.payloadForm.value['nodeModel']) {
      this.allNodes = StringOperator.search(term, this.allNodes);
    }
    if (this.payloadForm.value['manufacturer']) {
      this.allNodes = StringOperator.search(term, this.allNodes);
    }
    if (this.payloadForm.value['macName']) {
      this.allNodes = StringOperator.search(term, this.allNodes);
    }
    if (this.payloadForm.value['nodeId']) {
      this.allNodes = StringOperator.search(term, this.allNodes);
    }
  }

  public getAllNodes(): void {
    this.nodeService.getAll()
      .subscribe((data) => {
        const computeNodes = _.filter(data, (item) => {
          return item.type === 'compute';
        });
        this.allNodes = computeNodes;
        this.dataStore = computeNodes;
        this.renderNodeInfo(computeNodes);
        for (const node of this.allNodes) {
          this.catalogsService.getSource(node.id, 'dmi')
            .subscribe(
              (item) => {
                const systemInfo = item['data']['System Information'];
                if (systemInfo) {
                  node.manufacturer = systemInfo['Manufacturer'];
                  node.model = systemInfo['Product Name'];
                }
              },
              (err) => { console.error(err); }
            );
        }
      });
  }

  public createForm() {
    this.payloadForm = this.fb.group({
      osType: new FormControl('', { validators: [Validators.required] }),
      nodeId: new FormControl('', { validators: [Validators.required] }),
      workflowName: '',
      version: new FormControl('', { validators: [Validators.required] }),
      rootPassword: new FormControl('RackHDRocks', { validators: [Validators.required] }),
      dnsServers: new FormControl('', { validators: [Validators.pattern(DNS_PATTERN)] }),
      networkDevice: '',
      installDisk: '',
      ipAddress: new FormControl(
        '',
        { validators: [Validators.pattern(IP_PATTERN), Validators.required] }
      ),
      gateway: new FormControl(
        '',
        { validators: [Validators.pattern(IP_PATTERN), Validators.required] }
      ),
      netmask: new FormControl(
        '',
        { validators: [Validators.pattern(IP_PATTERN), Validators.required] }
      ),
      repoUrl: new FormControl(
        '',
        { validators: [Validators.pattern(REPO_PATTERN), Validators.required] }
      ),
      nodeModel: '',
      manufacturer: '',
      macName: ''
    });
  }

  public onNodeChange(item) {
    this.search(item);
  }

  public onNodeIdChange(item) {
    this.selectedNodeId = item;
    this.payloadForm.patchValue({ nodeId: item });
    this.getInstallDisk(this.selectedNodeId, 'driveId');
    this.getNetworkDevice(this.selectedNodeId, 'ohai');
  }

  public onChangeOsType(item) {
    this.payloadForm.patchValue({ workflowName: this.OS_TYPE_NAME[item] });
    this.selectedRepoPlaceHolder = this.REPO_PLACE_HOLDER[item];
  }

  public onChangeNetworkDevice(item: string) {
    if (item) {
      this.enableNetworkSetting = true;
      this.modifyDefaultSetting = true;
    } else {
      this.enableNetworkSetting = false;
      this.modifyDefaultSetting = false;
    }
    const device = _.split(item, ',');
    this.selectedNetworkDevice = device[0];
  }

  public renderNodeInfo(nodes) {
    const list = _.map(nodes, (node) => {
      return forkJoin(
        this.getNodeSku(node).pipe(catchError(() => of(null))),
        this.getNodeObm(node).pipe(catchError(() => of(null))),
        this.getNodeTag(node).pipe(catchError(() => of(null)))
      ).pipe(
        map((results) => {
          node['sku'] = results[0];
          node['obms'] = results[1];
          node['tags'] = results[2];
        })
      );
    });

    return forkJoin(list)
      .subscribe((data) => {
        this.allNodes = _.cloneDeep(nodes);
        this.nodeStore = _.cloneDeep(nodes);
        this.selNodeStore = _.cloneDeep(nodes);
      });
  }

  public getNodeSku(node): Observable<string> {
    const hasSkuId = !!node.sku;
    const isComputeWithoutSku = (node.sku === null) && node.type === 'compute';
    if (hasSkuId) {
      return this.skuService.getByIdentifier(node.sku.split('/').pop())
        .pipe(map((data) => data.name));
    } else if (isComputeWithoutSku) {
      return this.catalogsService.getSource(node.id, 'ohai')
        .pipe(map((data) => data.data.dmi.base_board.product_name));
    } else {
      return of(null);
    }
  }

  public getNodeObm(node): Observable<string> {
    if (!_.isEmpty(node.obms)) {
      const obmId = node.obms[0].ref.split('/').pop();
      return this.obmService.getByIdentifier(obmId)
        .pipe(map((data) => data.config.host));
    } else {
      return of(null);
    }
  }

  public getNodeTag(node): Observable<string> {
    if (!_.isEmpty(node.tags)) {
      return this.tagService.getTagByNodeId(node.id)
        .pipe(
          map((data) => {
            if (_.isEmpty(data)) { return null; }
            return data.attributes.name;
          })
        );
    } else {
      return of(null);
    }
  }

  public onFilterSelect(node) {
    this.selectedNode = node;
    if (!_.isEqual(this.selNodeStore, [node])) {
      setTimeout(() => {
        this.selNodeStore = [node];
      });
    }
  }

  public onFilterRefresh() {
    this.selNodeStore = [];
    setTimeout(() => {
      this.nodeStore = _.cloneDeep(this.allNodes);
      this.selNodeStore = _.cloneDeep(this.allNodes);
    });
  }

  public onReset() {
    this.selNodeStore = [];
    this.nodeStore = [];
    this.createForm();
    this.diskOptions = null;
    this.networkDeviceOptions = null;
    this.selectedRepoPlaceHolder = 'Select OS TYPE first.';
    this.modifyDefaultSetting = false;

    setTimeout(() => {
      this.nodeStore = _.cloneDeep(this.allNodes);
      this.selNodeStore = _.cloneDeep(this.allNodes);
    });
  }

  public onNodeSelect(node) {
    this.selectedNode = node;
    if (!_.isEqual(this.nodeStore, [node])) {
      this.nodeStore = [node];
    }
    this.onNodeIdChange(node['id']);
  }

  public onNodeRefresh() {
    this.nodeStore = [];
    setTimeout(() => {
      this.nodeStore = _.cloneDeep(this.allNodes);
    });
  }

  public getInstallDisk(nodeId: string, source: string): void {
    this.catalogsService.getSource(nodeId, source)
      .subscribe(
        (data) => {
          this.diskOptions = new Array();
          const diskData = data['data'];
          for (const disk of diskData) {
            this.diskOptions.push(disk['devName']);
          }
          this.diskOptionsReady = true;
        },
        (err) => { console.error(err); }
      );
  }

  public getNetworkDevice(nodeId: string, source: string): void {
    this.catalogsService.getSource(nodeId, source)
      .subscribe(
        (iterm) => {
          this.networkDeviceOptions = new Array();
          const usableInterface = [];
          const interfaceObj = iterm.data.network.interfaces;
          const keys = Object.keys(interfaceObj);
          for (const key of keys) {
            if (key.startsWith('eth')) {
              usableInterface.push(key);
              const interfaceKey = key + ', mac:' + Object.keys(interfaceObj[key]['addresses'])[0];
              this.networkDeviceOptions.push(interfaceKey);
            }
          }
        },
        (err) => { console.error(err); }
      );
  }

  public createPayload() {
    this.payloadJson = this.createPayloadOptions();
    this.editor.set(this.payloadJson);
    this.enableOsinstall = true;
  }

  public onSubmit() {
    this.confirmSubmited = false;
    const workflow = this.editor.get();
    this.payloadJson = workflow;
    this.workflowService.runWorkflow(
      this.selectedNodeId,
      this.OS_TYPE_NAME[this.payloadForm.value['osType']],
      this.payloadJson
    ).subscribe(
      (data) => { this.submitSuccess = true; },
      (err) => {
        this.submitSuccess = false;
        this.confirmSubmited = false;
      }
    );
  }

  public onConfirmSubmited() {
    this.confirmSubmited = true;
  }

  public createPayloadOptions(): object {
    let tmpJson = {};
    const generalJson = {};
    const version = { version: this.payloadForm.value['version'] };
    const repo = { repo: this.payloadForm.value['repoUrl'] };
    const rootPassword = { rootPassword: this.payloadForm.value['rootPassword'] };
    let installDisk = {};
    if (this.payloadForm.value['osType'] === 'ubuntu') {
      const ubuntuOnly = {
        baseUrl: 'install/netboot/ubuntu-installer/amd64',
        kargs: {
          'live-installer/net-image': this.payloadForm.value['repoUrl'] + '/ubuntu/install/filesystem.squashfs'
        }
      };
      _.assign(generalJson, ubuntuOnly);
    }
    if (!_.isEmpty(this.payloadForm.value['installDisk'])) {
      if (this.payloadForm.value['osType'] === 'esxi') {
        installDisk = { installDisk: this.payloadForm.value['installDisk'] };
      } else {
        installDisk = { installDisk: '/dev/' + this.payloadForm.value['installDisk'] };
      }
    }

    _.assign(generalJson, version, repo, rootPassword, installDisk);

    if (this.enableNetworkSetting) {
      if (!_.isEmpty(this.payloadForm.value['dnsServers'])) {
        const dnsServers = { dnsServers: [this.payloadForm.value['dnsServers']] };
        _.assign(generalJson, dnsServers);
      }

      const ipv4 = {
        ipAddr: this.payloadForm.value['ipAddress'],
        gateway: this.payloadForm.value['gateway'],
        netmask: this.payloadForm.value['netmask']
      };

      if (this.payloadForm.value['osType'] === 'esxi') {
        const vmnic = 'vmnic' + this.selectedNetworkDevice.substring(3);
        const networkDevices = {
          networkDevices: [{
            device: vmnic,
            ipv4
          }]
        };
        _.assign(generalJson, networkDevices);
      } else {
        const networkDevices = {
          networkDevices: [{
            device: this.selectedNetworkDevice,
            ipv4
          }]
        };
        _.assign(generalJson, networkDevices);
      }
    }
    tmpJson = _.assign(tmpJson, { options: { defaults: generalJson } });
    return tmpJson;
  }

  public search(term: string): void {
    this.searchTerms.next(term);
  }

  public formClassInvalid(value: string): boolean {
    return this.payloadForm.get(value).invalid;
  }

  get enableSavePayload() {
    const majorEnable = (!this.formClassInvalid('nodeId')) &&
      (!this.formClassInvalid('repoUrl') && (!this.formClassInvalid('version'))) &&
      (!this.formClassInvalid('rootPassword'));
    let networkEnable = true;
    if (this.enableNetworkSetting) {
      networkEnable = (!this.formClassInvalid('ipAddress')) && (!this.formClassInvalid('netmask'))
        && (!this.formClassInvalid('gateway'));
    }
    return majorEnable && networkEnable;
  }
}
