export interface FoodRecognitionService { recognize(localPhotoUri: string): Promise<{ foodId: string; confidence: number }[]> }
export interface EmailNotificationService { send(to: string, subject: string, body: string): Promise<void> }
export interface CloudSyncService { synchronize(): Promise<void> }
export interface GroceryPriceService { getPrices(ingredientIds: string[]): Promise<Record<string, number>> }
// Interfaces only. No implementation is registered and no network requests are made.
