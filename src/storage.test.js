import { describe, it, expect } from 'vitest';
import { migratePanelConfig } from './storage.js';

describe('migratePanelConfig', () => {
    it('migrates standard panelKinds array to a Default Provider', () => {
        const furniture = {
            panelConfig: {
                algorithm: 'smart-mix',
                panelKinds: [
                    { id: '1', name: 'Standard', width: 2000, height: 1000 }
                ]
            }
        };
        migratePanelConfig(furniture);
        expect(furniture.panelConfig.panelKinds).toBeUndefined();
        expect(furniture.panelConfig.providers).toHaveLength(1);
        expect(furniture.panelConfig.providers[0].name).toBe('Default Provider');
        expect(furniture.panelConfig.providers[0].kinds).toHaveLength(1);
        expect(furniture.panelConfig.providers[0].kinds[0].id).toBe('1');
    });

    it('creates empty config with default provider safely', () => {
        const furniture = {};
        migratePanelConfig(furniture);
        expect(furniture.panelConfig.providers).toBeDefined();
        expect(furniture.panelConfig.providers[0].kinds).toHaveLength(1);
    });

    it('handles legacy flat width/height migration into providers seamlessly', () => {
        const furniture = {
            panelConfig: {
                width: 3000,
                height: 1500,
                kerf: 5
            }
        };
        migratePanelConfig(furniture);
        expect(furniture.panelConfig.width).toBeUndefined();
        expect(furniture.panelConfig.panelKinds).toBeUndefined();
        expect(furniture.panelConfig.providers).toHaveLength(1);
        expect(furniture.panelConfig.providers[0].kinds[0].width).toBe(3000);
    });
});
