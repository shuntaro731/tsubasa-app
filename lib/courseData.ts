// コースプラン情報
import type { PlanType } from '../types/index';

export interface PlanInfo {
  id: PlanType;
  name: string;
  monthlyHours: number;
  description: string;
  subjects: string[];
  features: string[];
}

export const COURSE_PLANS: PlanInfo[] = [
  {
    id: 'light',
    name: 'ライトコース',
    monthlyHours: 15,
    description: '国語＋単科指導で基礎をしっかり固めるコース',
    subjects: ['国語', '選択科目（1科目）'],
    features: [
      '月15時間の個別指導',
      '国語を中心とした基礎学習',
      '1科目を選択して集中指導',
      'リーズナブルな料金設定'
    ]
  },
  {
    id: 'half',
    name: 'ハーフコース',
    monthlyHours: 30,
    description: '全教科対応でバランス良く学習できるコース',
    subjects: ['国語', '数学', '英語', '理科', '社会'],
    features: [
      '月30時間の個別指導',
      '全教科に対応',
      'バランスの取れた学習プラン',
      '定期テスト対策も充実'
    ]
  },
  {
    id: 'free',
    name: 'フリーコース',
    monthlyHours: 45,
    description: '最大45時間で集中的に学習できるコース',
    subjects: ['国語', '数学', '英語', '理科', '社会', '専門科目'],
    features: [
      '月45時間の個別指導',
      '全教科対応＋専門科目',
      '受験対策にも最適',
      '最も充実したサポート体制'
    ]
  }
];

// プランIDから詳細情報を取得する関数
export const getPlanInfo = (planId: PlanType): PlanInfo | undefined => {
  return COURSE_PLANS.find(plan => plan.id === planId);
};

// すべてのプランを取得する関数
export const getAllPlans = (): PlanInfo[] => {
  return COURSE_PLANS;
};