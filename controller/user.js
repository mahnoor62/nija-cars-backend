const {success_response, error_response} = require('../helpers/response');
const {Op} = require('sequelize');
const User = require('../models/user');
const sequelize = require('../config');

exports.updateUsersGameStatus = async (req, res) => {
    try {
        const {id, name, email, password} = req.body;
        // case1:
        if (name && !id && !email && !password) {
//         if (name) {
            const existing = await User.findOne({where: {name}});
            if (existing) return error_response(res, 400, 'Username already exists. please try a different username!');
            const user = await User.create({name});
            return success_response(res, 200, 'User registered successfully', user);
        }

        // case2:
        if (id && name && email && password) {
            const existingUser = await User.findOne({where: {id}});

            if (!existingUser) {
                return error_response(res, 400, 'User ID does not exist!');
            }

            if (existingUser.email) {
                // Email already exists → User registered
                return error_response(res, 400, 'User email already registered. Please login!');
            }

            // Email is null → Send OTP
            const code = speakeasy.totp({secret: speakeasy.generateSecret({length: 6}).base32, encoding: 'base32'});

            // await TempUser.destroy({where: {email, name}});
            await TempUser.destroy({
                where: {
                    [Op.or]: [
                        {email: email.toLowerCase().trim()},
                        {name: name.trim()}
                    ]
                }
            });


            const tempUser = await TempUser.create({
                email: email.toLowerCase(),
                name,
                password,
                unique_id: uuidv4(),
                code
            });

            await send_email(
                process.env.MAIL_USER,
                process.env.MAIL_HOST,
                process.env.MAIL_PASS,
                process.env.MAIL_PORT,
                process.env.MAIL_FROM,
                process.env.APP_NAME,
                email,
                code,
                'Verification Code For Login'
            );

            return success_response(res, 200, 'OTP sent to user for login', {
                uniqueId: tempUser.unique_id,
                otp: tempUser.code
            });
        }


        // Case 3
        if (name && email && password) {
            const isUsernameExists = await User.findOne({
                where: {name},
                attributes: ['id']
            });

            const isEmailExists = await User.findOne({
                where: {email},
                attributes: ['id']
            });

            if (isUsernameExists && isEmailExists) {
                return error_response(res, 400, "Email and Username already exist. Please login!");
            }

            if (isUsernameExists) {
                return error_response(res, 400, "Username already exists. Please try a different username.");
            }

            if (isEmailExists) {
                return error_response(res, 400, "Email already exists. Please login.");
            }

            // Proceed to create user here
            // }

            // if (name && email && password) {
            //     const isUsernameExists = await User.findOne({
            //         where: {name},
            //         attributes: ['id']
            //     });
            //
            //     // const existing = await User.findOne({ where: { name, email } });
            //     // if (isUsernameExists) return error_response(res, 400, 'Username already exists. Please login!');
            //
            //     const isEmailExists = await User.findOne({
            //         where: {email},
            //         attributes: ['id']
            //     });
            //
            //     let uniqueVar = '';
            //
            //     if (isUsernameExists && isEmailExists) {
            //         uniqueVar = "Email and Username";
            //     } else {
            //         if (isUsernameExists) {
            //             uniqueVar = "Username"
            //         } else if (isEmailExists) {
            //             uniqueVar = "Email"
            //         }
            //     }
            //
            //     // const existing = await User.findOne({ where: { name, email } });
            //     if (isEmailExists || isUsernameExists) return error_response(res, 400, `${uniqueVar} already exists. Please login!`);

            const code = speakeasy.totp({secret: speakeasy.generateSecret({length: 6}).base32, encoding: 'base32'});
            // await TempUser.destroy({where: {email, name}});
            await TempUser.destroy({
                where: {
                    [Op.or]: [
                        {email: email.toLowerCase().trim()},
                        {name: name.trim()}
                    ]
                }
            });


            const tempUser = await TempUser.create({
                email: email.toLowerCase(),
                name,
                password,
                unique_id: uuidv4(),
                code
            });

            await send_email(
                process.env.MAIL_USER,
                process.env.MAIL_HOST,
                process.env.MAIL_PASS,
                process.env.MAIL_PORT,
                process.env.MAIL_FROM,
                process.env.APP_NAME,
                email,
                code,
                'Verification Code For Registration'
            );

            return success_response(res, 200, 'OTP sent for verification', {
                uniqueId: tempUser.unique_id,
                otp: tempUser.code
            });
        }

        return error_response(res, 400, 'Incomplete data for registration');
    } catch (error) {
        return error_response(res, 500, error.message);
    }
};



