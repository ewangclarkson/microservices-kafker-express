import IOrderRepository from "../IOrderRepository";
import {Order} from "../../domain/model/Order";
import {injectable} from "inversify";
import ElasticSearchClientManager from "../../elasticsearch/elasticsearch";
import {ElasticIndices} from "../../config/constants/ElasticIndices";
import {plainToClass} from "class-transformer";
import {PaymentStatus} from "../../config/constants/payment.status";

@injectable()
export default class OrderRepository implements IOrderRepository {

    /**
     * There will be the need for another table to store the list of items bought
     * But this is ommitted at the moment since we are only dealing with a prove of concept
     * And not the actual full ecommerce implementation
     * @param order
     */

    private readonly elasticClient: any;

    constructor() {
        this.elasticClient = ElasticSearchClientManager
            .getInstance()
            .getElasticClient();
    }


    async create(order: Order): Promise<Order> {

        order.orderStatus = PaymentStatus.PENDING;
        order = await Order.save(order);

        // add the data to elastic search
        await this.elasticClient
            .index({
                index: ElasticIndices.ORDERS,
                id: order.id,
                document: order
            });

        return Promise.resolve(order);
    }

    async delete(id: string): Promise<Order> {
        const order = await Order.findOneById(id);

        await Order.delete(id);
        await this.elasticClient
            .delete({
                id: id,
                index: ElasticIndices.ORDERS,
            });

        return Promise.resolve(order!);
    }

    async findOne(id: string): Promise<Order | null> {
        try {
            const order = await this.elasticClient
                .get<Order>({
                    id: id,
                    index: ElasticIndices.ORDERS,
                });

            return Promise.resolve(order._source!);
        } catch (e) {
            return Promise.resolve(null);
        }

    }

    async find(): Promise<Order[]> {

        try {
            const body = await this.elasticClient
                .search({
                    index: ElasticIndices.ORDERS,
                    query: {match_all: {}}
                });

            const orders = body.hits.hits.map((document) => {
                return plainToClass(Order, document._source);
            });

            return Promise.resolve(orders);
        } catch (e) {
            return Promise.resolve([]);
        }
    }

    async update(id: string, order: Order): Promise<Order> {
        order = await Order.save(order);
        await this.elasticClient
            .update({
                index: ElasticIndices.ORDERS,
                id: id,
                doc: order
            });
        return Promise.resolve(order);
    }

}