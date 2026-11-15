'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(
            'InterviewQuestions',
            'followUpStatus',
            {
                type: Sequelize.ENUM(
                    'pending',
                    'not_needed',
                    'generated'
                ),
                allowNull: false,
                defaultValue: 'pending'
            }
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(
            'InterviewQuestions',
            'followUpStatus'
        );
    }
};