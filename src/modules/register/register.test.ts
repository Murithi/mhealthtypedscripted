
import { request } from 'graphql-request'

import { User } from "../../entity/User";

import { duplicateEmail, emailNotLongEnough, passwordNotLongEnough } from './errorMessages'
import { createTypeormConn } from "../../utils/createTypeormConnection";


const email = "boom@bob.com"
const password = "jkokjojkl"

const mutation = (e: string, p: string) => `
mutation{
        register(email: "${e}", password: "${p}"){
            path
            message
        }
    } `

beforeAll(async () => {
    await createTypeormConn();
});

describe('Register User', () => {
    it('Can Register New User', async () => {

        //Ensure we can register new user
        let url = process.env.TEST_HOST as string
        const response = await request(url, mutation(email, password))
        expect(response).toEqual({ register: null })
        const users = await User.find({ where: { email } })
        expect(users).toHaveLength(1);
        const user = users[0]
        expect(user.email).toEqual(email)
        expect(user.password).not.toEqual(password)

    });
    it('Checks duplicate emails', async () => {
        //it for duplicate emails
        const response2: any = await request(process.env.TEST_HOST as string, mutation(email, password))
        console.log(response2)
        expect(response2.register).toHaveLength(1)
        expect(response2.register[0]).toEqual({
            path: "email",
            message: duplicateEmail
        })
    });
    it('Checks bad emails', async () => {
        //catch bad emails
        const response3: any = await request(process.env.TEST_HOST as string, mutation("b", password))
        expect(response3).toEqual({
            register: [{
                path: "email",
                message: emailNotLongEnough
            },
            {
                path: "email",
                message: "email must be a valid email"
            }]
        })

    });
    it('Checks password length', async () => {
        //it for duplicate emails
        const response2: any = await request(process.env.TEST_HOST as string, mutation(email, "pe"))
        console.log(response2)
        expect(response2.register[0]).toEqual({
            path: "password",
            message: passwordNotLongEnough
        })
    });

    it('Checks bad password and bad email', async () => {
        //it for duplicate emails
        const response: any = await request(process.env.TEST_HOST as string, mutation("pe", "pe"))
        console.log(response)
        expect(response).toEqual({
            register: [{
                path: "email",
                message: emailNotLongEnough
            },
            {
                path: "email",
                message: "email must be a valid email"
            },
            {
                path: "password",
                message: passwordNotLongEnough
            }
            ]
        })
    });
})