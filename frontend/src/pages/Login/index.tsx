import {
  ApiOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  CompassOutlined,
  DeploymentUnitOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  FilePptOutlined,
  LockOutlined,
  RadarChartOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { animate, stagger } from 'animejs';
import { Button, Checkbox, Form, Input, Typography, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { login, type LoginPayload } from '../../api/auth';
import { isPreviewFallbackAllowed } from '../../api/runtimeMode';
import { useAuthStore } from '../../stores/authStore';

const t = {
  demandInsight: '\u9700\u6c42\u6d1e\u5bdf',
  customerData: '\u5ba2\u6237\u8d44\u6599\u89e3\u6790',
  solutionGenerate: '\u65b9\u6848\u751f\u6210',
  agentReasoning: 'Agent \u534f\u540c\u63a8\u7406',
  architectureDesign: '\u67b6\u6784\u8bbe\u8ba1',
  gisOrchestration: 'GIS \u80fd\u529b\u7f16\u6392',
  pptDelivery: 'PPT \u4ea4\u4ed8',
  resultOutput: '\u6210\u679c\u4e00\u952e\u8f93\u51fa',
  brandArea: 'GeoAgent Solution Workspace \u54c1\u724c\u533a',
  workbenchName: 'GIS \u89e3\u51b3\u65b9\u6848\u667a\u80fd\u5de5\u4f5c\u53f0',
  activeProjects: '\u6d3b\u8dc3\u9879\u76ee',
  agentNodes: 'Agent \u8282\u70b9',
  deliveryRate: '\u4ea4\u4ed8\u6210\u529f\u7387',
  deliveryChain: '\u65b9\u6848\u4ea4\u4ed8\u94fe\u8def',
  loginTitle: '\u767b\u5f55\u5de5\u4f5c\u53f0',
  loginDesc: '\u4ece\u5ba2\u6237\u9700\u6c42\u3001\u65b9\u6848\u751f\u6210\u3001\u67b6\u6784\u8bbe\u8ba1\u5230 PPT \u4ea4\u4ed8\uff0c\u8fdb\u5165 GeoAgent \u5de5\u4f5c\u53f0\u7ee7\u7eed\u63a8\u8fdb\u9879\u76ee\u3002',
  username: '\u7528\u6237\u540d',
  usernameRequired: '\u8bf7\u8f93\u5165\u7528\u6237\u540d',
  usernamePlaceholder: '\u8bf7\u8f93\u5165\u7528\u6237\u540d',
  password: '\u5bc6\u7801',
  passwordRequired: '\u8bf7\u8f93\u5165\u5bc6\u7801',
  passwordPlaceholder: '\u8bf7\u8f93\u5165\u5bc6\u7801',
  remember: '\u8bb0\u4f4f\u6211',
  forgot: '\u5fd8\u8bb0\u5bc6\u7801\uff1f',
  loggingIn: '\u6b63\u5728\u767b\u5f55...',
  loginButton: '\u767b\u5f55\u5de5\u4f5c\u53f0',
  defaultAccount: '\u9ed8\u8ba4\u672c\u5730\u9884\u89c8\u8d26\u53f7\uff1aadmin / admin123',
  loginSuccess: '\u767b\u5f55\u6210\u529f',
  localPreview: '\u672c\u5730\u9884\u89c8',
  previewWarning: '\u767b\u5f55\u63a5\u53e3\u6682\u4e0d\u53ef\u7528\uff0c\u5df2\u8fdb\u5165\u672c\u5730\u9884\u89c8\u6a21\u5f0f\u3002\u542f\u52a8\u540e\u7aef\u540e\u4f1a\u81ea\u52a8\u4f7f\u7528\u771f\u5b9e\u63a5\u53e3\u3002',
  loginFailed: '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u6216\u670d\u52a1\u72b6\u6001'
};

const deliveryStages = [
  { label: t.demandInsight, caption: t.customerData, icon: SearchOutlined },
  { label: t.solutionGenerate, caption: t.agentReasoning, icon: BulbOutlined },
  { label: t.architectureDesign, caption: t.gisOrchestration, icon: DeploymentUnitOutlined },
  { label: t.pptDelivery, caption: t.resultOutput, icon: FilePptOutlined }
];

type ProjectedPoint = { x: number; y: number; z: number; visible: boolean };

function projectPoint(lat: number, lon: number, rotation: number, radius: number, centerX: number, centerY: number): ProjectedPoint {
  const phi = (lat * Math.PI) / 180;
  const theta = ((lon + rotation) * Math.PI) / 180;
  const x3 = Math.cos(phi) * Math.sin(theta);
  const y3 = Math.sin(phi);
  const z3 = Math.cos(phi) * Math.cos(theta);
  const depth = 0.72 + z3 * 0.18;

  return {
    x: centerX + x3 * radius * depth,
    y: centerY - y3 * radius * depth,
    z: z3,
    visible: z3 > -0.18
  };
}

function drawCurve(ctx: CanvasRenderingContext2D, points: ProjectedPoint[], color: string, alpha: number, width: number) {
  const visible = points.filter((point) => point.visible);
  if (visible.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  visible.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.restore();
}

function HolographicGlobe({ dimmed }: { dimmed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    let frame = 0;
    let raf = 0;
    const stars = Array.from({ length: 120 }, (_, index) => ({
      x: (Math.sin(index * 91.7) + 1) / 2,
      y: (Math.sin(index * 47.3 + 2.1) + 1) / 2,
      size: 0.45 + ((index * 17) % 9) / 10,
      speed: 0.16 + ((index * 13) % 8) / 40
    }));

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || 900;
      const height = parent?.clientHeight || 720;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width * 0.47;
      const centerY = height * 0.5;
      const radius = Math.min(width, height) * 0.31;
      const rotation = frame * 0.075 - 152;

      context.clearRect(0, 0, width, height);

      const bg = context.createRadialGradient(centerX, centerY, radius * 0.08, centerX, centerY, radius * 2.15);
      bg.addColorStop(0, 'rgba(92, 220, 255, 0.2)');
      bg.addColorStop(0.32, 'rgba(34, 123, 174, 0.14)');
      bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalAlpha = dimmed ? 0.38 : 0.68;
      stars.forEach((star) => {
        const pulse = 0.45 + Math.sin(frame * star.speed * 0.04 + star.x * 12) * 0.28;
        context.fillStyle = `rgba(223, 253, 244, ${Math.max(0.12, pulse)})`;
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();

      const globe = context.createRadialGradient(centerX - radius * 0.34, centerY - radius * 0.36, radius * 0.08, centerX, centerY, radius);
      globe.addColorStop(0, 'rgba(178, 236, 255, 0.72)');
      globe.addColorStop(0.18, 'rgba(55, 160, 207, 0.72)');
      globe.addColorStop(0.42, 'rgba(21, 91, 131, 0.82)');
      globe.addColorStop(0.72, 'rgba(8, 40, 66, 0.95)');
      globe.addColorStop(1, 'rgba(2, 11, 22, 0.98)');
      context.fillStyle = globe;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.clip();

      for (let lat = -52; lat <= 52; lat += 13) {
        const cloudPoints: ProjectedPoint[] = [];
        for (let lon = -180; lon <= 180; lon += 4) {
          const wave = Math.sin((lon + frame * 0.14) * 0.035 + lat * 0.09) * 1.9;
          cloudPoints.push(projectPoint(lat + wave, lon + frame * 0.035, rotation * 0.65, radius, centerX, centerY));
        }
        drawCurve(context, cloudPoints, '#ffffff', 0.034, 2.2);
      }

      for (let band = 0; band < 9; band += 1) {
        const y = centerY - radius * 0.72 + band * radius * 0.18;
        const bandGradient = context.createLinearGradient(centerX - radius, y, centerX + radius, y);
        bandGradient.addColorStop(0, 'rgba(255,255,255,0)');
        bandGradient.addColorStop(0.35, 'rgba(173,236,255,0.025)');
        bandGradient.addColorStop(0.65, 'rgba(173,236,255,0.04)');
        bandGradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.strokeStyle = bandGradient;
        context.lineWidth = 1;
        context.beginPath();
        context.ellipse(centerX, y, radius * (0.64 + band * 0.035), radius * 0.035, 0, 0, Math.PI * 2);
        context.stroke();
      }

      context.restore();

      context.save();
      context.globalCompositeOperation = 'lighter';
      const rim = context.createRadialGradient(centerX, centerY, radius * 0.78, centerX, centerY, radius * 1.18);
      rim.addColorStop(0, 'rgba(80, 214, 178, 0)');
      rim.addColorStop(0.58, 'rgba(98, 218, 255, 0.28)');
      rim.addColorStop(0.86, 'rgba(80, 214, 178, 0.18)');
      rim.addColorStop(1, 'rgba(8, 145, 178, 0)');
      context.fillStyle = rim;
      context.beginPath();
      context.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2);
      context.fill();
      context.restore();

      for (let lat = -60; lat <= 60; lat += 20) {
        const points: ProjectedPoint[] = [];
        for (let lon = -180; lon <= 180; lon += 4) points.push(projectPoint(lat, lon, rotation, radius, centerX, centerY));
        drawCurve(context, points, '#9de8ff', lat === 0 ? 0.14 : 0.07, lat === 0 ? 0.9 : 0.6);
      }

      for (let lon = -180; lon < 180; lon += 30) {
        const points: ProjectedPoint[] = [];
        for (let lat = -82; lat <= 82; lat += 3) points.push(projectPoint(lat, lon, rotation, radius, centerX, centerY));
        drawCurve(context, points, '#77d8ff', 0.055, 0.55);
      }

      context.save();
      context.globalCompositeOperation = 'screen';
      context.translate(centerX, centerY);
      context.rotate(-0.22 + Math.sin(frame * 0.006) * 0.025);
      const scan = context.createLinearGradient(-radius, 0, radius, 0);
      scan.addColorStop(0, 'rgba(255,255,255,0)');
      scan.addColorStop(0.46, 'rgba(169,235,255,0.02)');
      scan.addColorStop(0.5, 'rgba(169,235,255,0.24)');
      scan.addColorStop(0.54, 'rgba(169,235,255,0.02)');
      scan.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = scan;
      context.beginPath();
      context.ellipse(Math.sin(frame * 0.012) * radius * 0.52, 0, radius * 0.18, radius * 1.05, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.translate(centerX, centerY);
      context.rotate(-0.34);
      context.strokeStyle = 'rgba(98, 218, 255, 0.28)';
      context.lineWidth = 1.2;
      context.beginPath();
      context.ellipse(0, 0, radius * 1.28, radius * 0.28, 0, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = 'rgba(80, 214, 178, 0.2)';
      context.beginPath();
      context.ellipse(0, 0, radius * 1.5, radius * 0.34, 0, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [dimmed]);

  return (
    <div className={`login-globe-scene${dimmed ? ' is-dimmed' : ''}`}>
      <canvas className="login-globe-canvas-v2" ref={canvasRef} aria-hidden="true" />
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.runtimeMode === 'PREVIEW' || Boolean(state.token));
  const setAuth = useAuthStore((state) => state.setAuth);
  const setPreviewAuth = useAuthStore((state) => state.setPreviewAuth);
  const rootRef = useRef<HTMLDivElement>(null);
  const submitLockRef = useRef(false);
  const [formFocused, setFormFocused] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const card = root.querySelector('.login-card-v2');
    const stages = root.querySelectorAll('.login-delivery-stage');
    const metrics = root.querySelectorAll('.login-signal-card');

    const cardAnimation = card
      ? animate(card, {
          opacity: [0, 1],
          translateX: [28, 0],
          duration: 620,
          ease: 'outCubic'
        })
      : undefined;

    const stageAnimation = stages.length
      ? animate(stages, {
          opacity: [0, 1],
          translateY: [16, 0],
          delay: stagger(120, { start: 260 }),
          duration: 520,
          ease: 'outCubic'
        })
      : undefined;

    const metricAnimation = metrics.length
      ? animate(metrics, {
          opacity: [0, 1],
          translateY: [12, 0],
          delay: stagger(90, { start: 520 }),
          duration: 520,
          ease: 'outCubic'
        })
      : undefined;

    return () => {
      cardAnimation?.cancel();
      stageAnimation?.cancel();
      metricAnimation?.cancel();
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: (values: LoginPayload) => login(values),
    onSuccess: (result) => {
      setAuth(result);
      message.success(t.loginSuccess);
      navigate(from, { replace: true });
    },
    onError: (error, values) => {
      const isLocalPreviewAccount = values.username === 'admin' && values.password === 'admin123';
      const errorMessage = (error as Error).message || '';

      if (isLocalPreviewAccount && isPreviewFallbackAllowed(error)) {
        setPreviewAuth({
          userId: 'local-preview-user',
          username: 'admin',
          realName: t.localPreview,
          role: 'ADMIN'
        });
        message.warning(t.previewWarning);
        navigate(from, { replace: true });
        return;
      }

      message.error(errorMessage || t.loginFailed);
    },
    onSettled: () => {
      submitLockRef.current = false;
    }
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className={`login-screen-v2${formFocused ? ' is-form-focused' : ''}`} ref={rootRef}>
      <section className="login-brand-panel-v2" aria-label={t.brandArea}>
        <div className="login-nebula-layer" aria-hidden="true" />
        <div className="login-grid-layer" aria-hidden="true" />
        <HolographicGlobe dimmed={formFocused} />

        <div className="login-brand-content">
          <div className="login-brand-lockup-v2">
            <span className="login-brand-logo-v2">G</span>
            <span>
              <strong>GeoAgent</strong>
              <small>Solution Workspace</small>
            </span>
          </div>

          <Typography.Title level={1}>GeoAgent Solution Workspace</Typography.Title>
          <Typography.Title level={3}>{t.workbenchName}</Typography.Title>
          <Typography.Text>AI-powered GIS solution delivery</Typography.Text>

          <div className="login-signal-row" aria-hidden="true">
            <div className="login-signal-card">
              <RadarChartOutlined />
              <strong>38</strong>
              <span>{t.activeProjects}</span>
            </div>
            <div className="login-signal-card">
              <ClusterOutlined />
              <strong>126</strong>
              <span>{t.agentNodes}</span>
            </div>
            <div className="login-signal-card">
              <CheckCircleOutlined />
              <strong>92%</strong>
              <span>{t.deliveryRate}</span>
            </div>
          </div>
        </div>

        <div className="login-delivery-chain" aria-label={t.deliveryChain}>
          {deliveryStages.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div className="login-delivery-stage" key={stage.label}>
                <span className="login-stage-icon">
                  <Icon />
                </span>
                <strong>{stage.label}</strong>
                <small>{stage.caption}</small>
                {index < deliveryStages.length - 1 && <ArrowRightOutlined className="login-stage-arrow" />}
              </div>
            );
          })}
        </div>
      </section>

      <section
        className="login-form-panel-v2"
        onMouseEnter={() => setFormFocused(true)}
        onMouseLeave={() => setFormFocused(false)}
        onFocusCapture={() => setFormFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFormFocused(false);
        }}
      >
        <div className="login-card-v2">
          <div className="login-card-kicker">
            <CompassOutlined />
            <span>Solution Studio</span>
          </div>
          <Typography.Title level={2}>{t.loginTitle}</Typography.Title>
          <Typography.Text type="secondary">{t.loginDesc}</Typography.Text>

          <Form<LoginPayload & { remember?: boolean }>
            layout="vertical"
            requiredMark={false}
            initialValues={{ username: 'admin', password: 'admin123', remember: true }}
            onFinish={(values) => {
              if (submitLockRef.current || loginMutation.isPending) return;
              submitLockRef.current = true;
              loginMutation.mutate({ username: values.username, password: values.password });
            }}
          >
            <Form.Item name="username" label={t.username} rules={[{ required: true, message: t.usernameRequired }]}>
              <Input prefix={<UserOutlined />} size="large" placeholder={t.usernamePlaceholder} autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" label={t.password} rules={[{ required: true, message: t.passwordRequired }]}>
              <Input.Password
                prefix={<LockOutlined />}
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                size="large"
                placeholder={t.passwordPlaceholder}
                autoComplete="current-password"
              />
            </Form.Item>
            <div className="login-form-row-v2">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{t.remember}</Checkbox>
              </Form.Item>
              <Button type="link" className="login-forgot-v2">{t.forgot}</Button>
            </div>
            <Button type="primary" htmlType="submit" size="large" block loading={loginMutation.isPending}>
              {loginMutation.isPending ? t.loggingIn : t.loginButton}
            </Button>
          </Form>

          <div className="login-card-footer">
            <ApiOutlined />
            <span>{t.defaultAccount}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
