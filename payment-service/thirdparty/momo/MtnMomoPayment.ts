import PaymentInterface from "../payment.interface";

import PaymentResponseDto from "../../domain/dto/PaymentResponseDto";
import ProviderRequest from "../provider.request";
import IPaymentRepository from "../../repository/IPaymentRepository";
import {IOC} from "../../config/ioc/inversify.ioc.types";
import {inject, injectable} from "inversify";
import ProviderResponse from "../ProviderResponse";
import {PaymentStatus} from "../../config/constants/payment.status";
import {plainToClass} from "class-transformer";

@injectable()
export default class MtnMomoPayment implements PaymentInterface {
    private _paymentRepository: IPaymentRepository;

    constructor(@inject(IOC.PaymentRepository) paymentRepository: IPaymentRepository) {
        this._paymentRepository = paymentRepository;
    }

    async processPayment(paymentRequest: ProviderRequest): Promise<void> {
        console.log("Momo Payment success");
        return Promise.resolve();
    }

    async checkPaymentStatus(payStatusRequest: ProviderRequest): Promise<PaymentResponseDto> {
        return Promise.resolve(new PaymentResponseDto());
    }

    async handlePaymentResponse(paymentResponseDto: ProviderResponse): Promise<PaymentResponseDto> {

        let payment = await this._paymentRepository.findOne(paymentResponseDto.processingNumber);
        if (payment) {
            if (paymentResponseDto.paymentStatus === PaymentStatus.COMPLETED) {
                payment.paymentStatus = PaymentStatus.COMPLETED;
                payment=await this._paymentRepository.update(payment.id, payment);
            } else {
                payment.paymentStatus = PaymentStatus.FAILED;
                payment = await this._paymentRepository.update(payment.id, payment);
            }
        }
        return Promise.resolve(plainToClass(PaymentResponseDto, payment, {excludeExtraneousValues: true}));
    }

}