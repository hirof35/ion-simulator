// 1. 粒子の種類を定義する型
type IonType = 'cation' | 'anion';

interface IonConfig {
  x: number;
  y: number;
  radius: number;
  type: IonType;
  label: string;
}

// 2. イオン（粒子）クラスの定義
class Ion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: IonType;
  label: string;
  color: string;

  constructor(config: IonConfig) {
    this.x = config.x;
    this.y = config.y;
    // 初期速度はランダム（ブラウン運動の模擬）
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.radius = config.radius;
    this.type = config.type;
    this.label = config.label;
    // 陽イオンは青（正）、陰イオンは赤（負）
    this.color = config.type === 'cation' ? '#3498db' : '#e74c3c';
  }

  // 移動処理（電場からの影響を引数に受ける）
  update(width: number, height: number, isPowerOn: boolean) {
    if (isPowerOn) {
      // 電気分解モード：陽イオンは陰極（左）、陰イオンは陽極（右）へ引き寄せられる
      const attraction = 0.1;
      if (this.type === 'cation') {
        this.vx -= attraction; // 左（陰極）へ
      } else {
        this.vx += attraction; // 右（陽極）へ
      }
    } else {
      // 通常モード：ランダムに少し揺かす（熱運動）
      this.vx += (Math.random() - 0.5) * 0.2;
      this.vy += (Math.random() - 0.5) * 0.2;
    }

    // 速度の制限（摩擦抵抗の模擬）
    this.vx *= 0.95;
    this.vy *= 0.95;

    // 位置の更新
    this.x += this.vx;
    this.y += this.vy;

    // 壁との衝突判定
    if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -1; }
    if (this.x + this.radius > width) { this.x = width - this.radius; this.vx *= -1; }
    if (this.y - this.radius < 0) { this.y = this.radius; this.vy *= -1; }
    if (this.y + this.radius > height) { this.y = height - this.radius; this.vy *= -1; }
  }

  // 描画処理
  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();

    // イオンの記号（Na+, Cl- など）を描画
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.label, this.x, this.y);
  }
}

// 3. シミュレーター全体の管理クラス
class ElectrolysisSimulator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ions: Ion[] = [];
  private isPowerOn: boolean = false;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    this.initIons();
    this.animate();
  }

  // 初期イオン（例: 塩化ナトリウム溶液 Na+ と Cl-）の生成
  private initIons() {
    const pairCount = 15; // イオン対の数
    for (let i = 0; i < pairCount; i++) {
      // 陽イオン (Na+)
      this.ions.push(new Ion({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 15,
        type: 'cation',
        label: 'Na+'
      }));
      // 陰イオン (Cl-)
      this.ions.push(new Ion({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 18, // 陰イオンは少し大きめに
        type: 'anion',
        label: 'Cl-'
      }));
    }
  }

  // 電源のON/OFF切り替え
  public togglePower() {
    this.isPowerOn = !this.isPowerOn;
  }

  // 描画と更新のループ
  private animate = () => {
    // 画面のクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 電極（背景）の描画
    this.drawElectrodes();

    // 各イオンの更新と描画
    this.ions.forEach(ion => {
      ion.update(this.canvas.width, this.canvas.height, this.isPowerOn);
      ion.draw(this.ctx);
    });

    requestAnimationFrame(this.animate);
  }

  // 電極の視覚効果を描画
  private drawElectrodes() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 左側：陰極 (Cathode)
    this.ctx.fillStyle = this.isPowerOn ? 'rgba(52, 152, 219, 0.2)' : 'rgba(127, 140, 141, 0.2)';
    this.ctx.fillRect(0, 0, 30, h);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText('陰極 (-)', 40, 30);

    // 右側：陽極 (Anode)
    this.ctx.fillStyle = this.isPowerOn ? 'rgba(231, 76, 60, 0.2)' : 'rgba(127, 140, 141, 0.2)';
    this.ctx.fillRect(w - 30, 0, 30, h);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('陽極 (+)', w - 40, 30);
    this.ctx.textAlign = 'center'; // 元に戻す
  }
}

// --- 初期化ロジック ---
window.addEventListener('DOMContentLoaded', () => {
  const simulator = new ElectrolysisSimulator('simCanvas');
  
  // ボタンとの紐付け
  const btn = document.getElementById('toggleBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      simulator.togglePower();
      btn.textContent = btn.textContent === '電源 ON' ? '電源 OFF' : '電源 ON';
      btn.classList.toggle('active');
    });
  }
});