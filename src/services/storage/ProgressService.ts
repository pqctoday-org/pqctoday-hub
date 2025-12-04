import { saveAs } from 'file-saver';
import localforage from 'localforage';
import type { LearningProgress } from './types';

export class ProgressService {
    private static STORAGE_KEY = 'pki-learning-progress';

    /**
     * Save current progress to browser storage (auto-save)
     */
    static async saveToLocal(progress: LearningProgress): Promise<void> {
        try {
            await localforage.setItem(this.STORAGE_KEY, progress);
            console.log('Progress auto-saved to browser storage');
        } catch (error) {
            console.error('Failed to save progress locally:', error);
        }
    }

    /**
     * Load progress from browser storage
     */
    static async loadFromLocal(): Promise<LearningProgress | null> {
        try {
            const progress = await localforage.getItem<LearningProgress>(
                this.STORAGE_KEY
            );
            return progress;
        } catch (error) {
            console.error('Failed to load progress from local storage:', error);
            return null;
        }
    }

    /**
     * Export progress to downloadable JSON file
     */
    static exportToFile(progress: LearningProgress): void {
        const json = JSON.stringify(progress, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `pki-learning-progress-${timestamp}.json`;

        saveAs(blob, filename);
    }

    /**
     * Import progress from uploaded JSON file
     */
    static async importFromFile(file: File): Promise<LearningProgress> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = e.target?.result as string;
                    const progress = JSON.parse(json) as LearningProgress;

                    // Validate format
                    if (!this.validateProgressFormat(progress)) {
                        throw new Error('Invalid progress file format');
                    }

                    // Migrate if needed (version compatibility)
                    const migratedProgress = this.migrateProgress(progress);

                    resolve(migratedProgress);
                } catch (error) {
                    reject(new Error(`Failed to parse progress file: ${error}`));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Clear all local progress (reset)
     */
    static async clearLocal(): Promise<void> {
        await localforage.removeItem(this.STORAGE_KEY);
        console.log('Local progress cleared');
    }

    /**
     * Validate progress file format
     */
    private static validateProgressFormat(progress: any): boolean {
        return (
            typeof progress === 'object' &&
            typeof progress.version === 'string' &&
            typeof progress.timestamp === 'number' &&
            typeof progress.modules === 'object'
        );
    }

    /**
     * Migrate progress from older versions
     */
    private static migrateProgress(
        progress: LearningProgress
    ): LearningProgress {
        const currentVersion = '1.0.0';

        // Ensure artifacts exist (migration from pre-Module 3 state)
        if (!progress.artifacts) {
            progress.artifacts = {
                keys: [],
                certificates: [],
                csrs: []
            };
        }

        if (progress.version === currentVersion) {
            return progress;
        }

        // Handle version migrations
        if (!progress.version || progress.version === '0.9.0') {
            // Migrate from v0.9.0 to v1.0.0
            progress = {
                ...progress,
                version: currentVersion,
                // Add new fields with defaults
            };
        }

        return progress;
    }
}
