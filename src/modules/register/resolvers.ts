import * as bcrypt from "bcryptjs";
import * as yup from 'yup'
import { ResolverMap } from "../../types/graphql-utils";
import { GQL } from '../../types/schema';
import { User } from "../../entity/User";
import { formatYupError } from "../../utils/formatYupError";
import { duplicateEmail, emailNotLongEnough, emailNotValid, passwordNotLongEnough } from "./errorMessages";
import { createConfirmEmailLink } from "../../utils/confirmEmail";

const schema = yup.object().shape({
    email: yup.string().min(3, emailNotLongEnough).max(255).email(emailNotValid),
    password: yup.string().min(3, passwordNotLongEnough).max(255)
})
export const resolvers: ResolverMap = {
    Query: {
        bye: () => "hi",
    },
    Mutation: {
        register: async (
            _,
            args: GQL.IRegisterOnMutationArguments, { redis, url }) => {
            try {
                await schema.validate(args, { abortEarly: false })
            } catch (err) {
                return formatYupError(err)
            }
            const { email, password } = args
            const userAlreadyExists = await User.findOne({
                where: { email },
                select: ["id"]
            })


            if (!userAlreadyExists) {
                const hashedPassword = await bcrypt.hash(password, 10);
                const user = await User.create({
                    email,
                    password: hashedPassword
                });

                await user.save();

                await createConfirmEmailLink(
                    url, user.id, redis
                )
                return null
            }

            return [{ path: "email", message: duplicateEmail }]


        }
    }
};