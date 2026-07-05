import { Schema, model } from 'mongoose';
import { IProcessedEvent } from '../types';

const ProcessedEventSchema = new Schema<IProcessedEvent>({
    eventId:     { type: String, required: true, unique: true },
    orderId:     { type: String, required: true },
    processedAt: { type: Date, required: true },
});

export const ProcessedEvent = model<IProcessedEvent>('ProcessedEvent', ProcessedEventSchema);