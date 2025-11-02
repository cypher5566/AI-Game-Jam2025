/**
 * 技能 API 服務
 * 調用後端 API 獲取技能數據
 */

import { API_BASE_URL, API_ENDPOINTS } from './apiConfig';
import { Skill } from '../types';

/**
 * 獲取指定屬性的技能
 * @param type Pokemon 屬性（如 fire, water 等）
 * @param count 要獲取的技能數量（默認 12）
 * @returns 技能列表
 */
export async function fetchSkillsByType(
  type: string,
  count: number = 12
): Promise<Skill[]> {
  try {
    console.log(`[SkillsAPI] 獲取 ${type} 系技能，數量: ${count}`);

    const url = `${API_BASE_URL}${API_ENDPOINTS.SKILLS}?type=${type}&count=${count}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '獲取技能失敗');
    }

    console.log(`[SkillsAPI] 成功獲取 ${result.data.length} 個技能`);

    // 轉換後端數據格式為前端 Skill 類型
    const skills: Skill[] = result.data.map((skill: any) => ({
      id: skill.id,
      name: skill.name_zh || skill.name,  // 優先使用中文名稱
      name_en: skill.name_en,
      type: skill.type,
      power: skill.power || 0,
      accuracy: skill.accuracy || 100,
      pp: skill.pp || 0,
      description: skill.description || '無說明',
      category: skill.category,
    }));

    return skills;

  } catch (error) {
    console.error('[SkillsAPI] 獲取技能失敗:', error);
    throw error;
  }
}

/**
 * 獲取所有可用的屬性及其技能數量
 * @returns 屬性與技能數量的對照表
 */
export async function fetchSkillTypes(): Promise<Record<string, number>> {
  try {
    console.log('[SkillsAPI] 獲取所有屬性');

    const url = `${API_BASE_URL}${API_ENDPOINTS.SKILLS_TYPES}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '獲取屬性列表失敗');
    }

    console.log('[SkillsAPI] 成功獲取屬性列表:', result.data);

    return result.data;

  } catch (error) {
    console.error('[SkillsAPI] 獲取屬性列表失敗:', error);
    throw error;
  }
}
